let allMessages = [];

function renderMessages(messages) {
    const tbody = document.getElementById('messageBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    messages.forEach(msg => {
        const row = `
            <tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 12px;">${msg.id}</td>
                <td style="padding: 12px;">${msg.userName}</td>
                <td style="padding: 12px;">${msg.email}</td>
                <td style="padding: 12px;">${msg.message}</td>
                <td style="padding: 12px;">${msg.date ? new Date(msg.date).toLocaleString() : 'N/A'}</td>
                <td style="padding: 12px;">
                    <button onclick="deleteMessage(${msg.id})" style="background-color: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Delete</button>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

async function fetchMessages() {
    try {
        const response = await fetch('/api/admin/messages');
        allMessages = await response.json();
        
        const countEl = document.getElementById('messageCount');
        if (countEl) {
            countEl.textContent = allMessages.length;
        }
        renderMessages(allMessages);
    } catch (err) {
        console.error('Error fetching messages:', err);
    }
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
        const response = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchMessages(); // Refresh the list and count
        } else {
            const result = await response.json();
            alert('Error deleting message: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error deleting message:', err);
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allMessages.filter(msg => 
        (msg.userName && msg.userName.toLowerCase().includes(searchTerm)) || 
        (msg.email && msg.email.toLowerCase().includes(searchTerm)) || 
        (msg.message && msg.message.toLowerCase().includes(searchTerm)) ||
        (msg.id && msg.id.toString().includes(searchTerm)) ||
        (msg.date && new Date(msg.date).toLocaleString().toLowerCase().includes(searchTerm))
    );
    renderMessages(filtered);
}

async function updateDbStatus() {
    const statusEl = document.getElementById('dbStatus');
    if (!statusEl) return;

    try {
        const response = await fetch('/api/admin/db-status');
        const data = await response.json();
        statusEl.textContent = data.status === 'connected' ? 'connected' : 'not connected';
        statusEl.style.color = data.status === 'connected' ? '#27ae60' : '#e74c3c';
    } catch (err) {
        statusEl.textContent = 'not connected';
        statusEl.style.color = '#e74c3c';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
    updateDbStatus();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});