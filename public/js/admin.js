let allMessages = [];
let adminCreds = { user: '', pass: '' };

function renderMessages(messages) {
    const tbody = document.getElementById('messageBody');
    if (!tbody) return;

    tbody.innerHTML = messages.map(msg => {
        const btnText = msg.isReplied ? 'Replied ✓' : 'Reply';
        const btnColor = msg.isReplied ? '#27ae60' : '#3498db';
        
        return `
            <tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 12px;">${msg.id}</td>
                <td style="padding: 12px;">${msg.userName}</td>
                <td style="padding: 12px;">${msg.email}</td>
                <td style="padding: 12px;">${msg.message}</td>
                <td style="padding: 12px;">${msg.date ? new Date(msg.date).toLocaleString() : 'N/A'}</td>
                <td style="padding: 12px;">
                    <button onclick="replyToMessage(event, '${msg.email}', ${msg.id})" style="background-color: ${btnColor}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">${btnText}</button>
                    <button onclick="deleteMessage(${msg.id})" style="background-color: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

async function fetchMessages() {
    try {
        const response = await fetch('/api/admin/messages');
        allMessages = await response.json();
        document.getElementById('messageCount').textContent = allMessages.length;
        renderMessages(allMessages);
    } catch (err) {
        console.error('Error fetching messages:', err);
    }
}

function showAuthModal(title, callback) {
    const modal = document.createElement('div');
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.9); display:flex; align-items:center; justify-content:center; z-index:10000; backdrop-filter: blur(4px);";
    modal.innerHTML = `
        <div style="background:white; padding:32px; border-radius:12px; width:340px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); position:relative;">
            <button id="closeModal" style="position:absolute; top:12px; right:16px; background:none; border:none; cursor:pointer; color:#94a3b8; font-size:24px; line-height:1; transition:color 0.2s;" onmouseover="this.style.color='#1e293b'" onmouseout="this.style.color='#94a3b8'">&times;</button>
            <h2 style="margin:0 0 20px 0; font-family:sans-serif; color:#1e293b; font-size:20px;">${title}</h2>
            <input id="modalUser" type="text" placeholder="Username" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #e2e8f0; border-radius:6px; box-sizing:border-box;">
            <input id="modalPass" type="password" placeholder="Password" style="width:100%; padding:12px; margin-bottom:20px; border:1px solid #e2e8f0; border-radius:6px; box-sizing:border-box;">
            <button id="modalBtn" style="width:100%; padding:12px; background:#3498db; color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Confirm</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('closeModal').onclick = () => {
        document.body.removeChild(modal);
        if (title === 'Admin Login') {
            document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background-color:#f8fafc; color:#1e293b;"><h1>Access Denied</h1></div>';
        }
    };

    document.getElementById('modalBtn').onclick = async () => {
        const user = document.getElementById('modalUser').value;
        const pass = document.getElementById('modalPass').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });

            if (response.ok) {
                document.body.removeChild(modal);
                callback(user, pass);
            } else {
                alert('Invalid credentials');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Connection error. Please try again.');
        }
    };
}

async function deleteMessage(id) {
    showAuthModal('Confirm Deletion', async (user, pass) => {
        if (!confirm('Are you sure? This action is permanent.')) return;
        try {
            const response = await fetch(`/api/admin/messages/${id}`, { 
                method: 'DELETE',
                headers: { 'x-admin-user': user, 'x-admin-pass': pass }
            });
            if (response.ok) fetchMessages();
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    });
}

async function replyToMessage(event, email, id) {
    window.location.href = `mailto:${email}?subject=Re: Nexcore Inquiry (ID: ${id})`;
    try {
        const response = await fetch(`/api/admin/messages/${id}/replied`, { method: 'PATCH' });
        if (response.ok) {
            const btn = event.currentTarget;
            btn.innerHTML = 'Replied ✓';
            btn.style.backgroundColor = '#27ae60';
            const msg = allMessages.find(m => m.id === id);
            if (msg) msg.isReplied = true;
        }
    } catch (err) {
        console.error('Error updating reply status:', err);
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
    showAuthModal('Admin Login', (user, pass) => {
        fetchMessages();
        updateDbStatus();
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});