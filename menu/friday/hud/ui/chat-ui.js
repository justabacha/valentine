export function addChatMsg(text, type) {
  // type: 'friday', 'user', 'system'
  const feed = document.getElementById('chat-feed');
  if (!feed) return;
  
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  
  if (type !== 'system') {
    const label = document.createElement('span');
    label.className = 'msg-label';
    label.textContent = type === 'friday' ? 'FRI >' : 'YOU >';
    div.appendChild(label);
    div.appendChild(document.createTextNode(` ${text}`));
  } else {
    div.innerText = text;
  }
  
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

export function clearChatFeed() {
  const feed = document.getElementById('chat-feed');
  if (feed) feed.innerHTML = '';
}