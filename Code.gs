// ===== 設定 =====
const CLAUDE_API_KEY = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
const SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');

// ===== メイン処理 =====
function checkJobEmails() {
  const CLAUDE_API_KEY = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  const SLACK_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
  
  const MY_CONDITIONS = `
- Python自動化・DX推進系の業務（Selenium、API連携、データ加工など）
- 社内SE・運用改善・ツール開発系（ゴリゴリの新規開発メインはNG）
- Jira・Confluence・SharePoint・Office365などを使う現場
- リモートOKまたは愛知県内・通勤1時間以内
- 業務内容が具体的に書いてある案件（釣り案件NG）
- 40代歓迎または年齢不問
`;

  const GMAIL_QUERY = 'from:(levtech.jp OR persol.co.jp OR haken.en-japan.com OR hajimari.inc OR mynavi.jp OR r-agent.com OR green-japan.com OR dipmail.hatarako.net OR mid-works.com OR lancers.jp) newer_than:7d in:anywhere -label:bot処理済み';
  

  const threads = GmailApp.search(GMAIL_QUERY, 0, 10);
  
  if (threads.length === 0) {
    console.log('📭 対象メールなし（条件に合う求人メール：0件）');
    notifySlack(SLACK_WEBHOOK_URL, '本日の求人チェック結果', '条件に合う案件は0件でした', 'システム');
    return;
  }
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    messages.forEach(message => {
      const subject = message.getSubject();
      const body = message.getPlainBody().substring(0, 2000);
      
      // Claudeに判定させる
      const result = askClaude(CLAUDE_API_KEY, MY_CONDITIONS, subject, body);
      
      // 条件に合う場合だけSlack通知
      if (result.matched) {
          notifySlack(SLACK_WEBHOOK_URL, subject, result.reason, message.getFrom(), body.substring(0, 500));
      }
      
    });
    // 処理後に既読じゃなくてラベルを付ける
    const label = GmailApp.getUserLabelByName('bot処理済み') || GmailApp.createLabel('bot処理済み');
    thread.addLabel(label);
  });
  console.log(`✅ チェック完了`);
}


// ===== Claude API呼び出し =====
function askClaude(apiKey, conditions, subject, body) {
  const prompt = `
以下の求人メールを読んで、条件に合うか判定してください。

【私の条件】
${conditions}

【メール件名】
${subject}

【メール本文】
${body}

以下のJSON形式のみで答えてください：
{"matched": true or false, "reason": "理由を1〜2文で"}
`;

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  const data = JSON.parse(response.getContentText());
  const text = data.content[0].text;
  
  try {
    return JSON.parse(text);
  } catch(e) {
    return { matched: false, reason: '判定エラー' };
  }
}

// ===== Slack通知 =====
function notifySlack(webhookUrl, subject, reason, from, preview) {
  const message = {
    text: `🎯 *条件に合う案件が来ました！*\n*件名：* ${subject}\n*送信元：* ${from}\n*理由：* ${reason}\n\n*📄 本文抜粋：*\n${preview}`
  };
  
  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(message)
  });
}
