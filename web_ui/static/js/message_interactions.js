/**
 * Message Interactions - Reactions, Threading, Edit, Delete
 * Handles all interactive message features
 */

// Global state for message interactions
let currentReplyTo = null;
let currentEditingMessage = null;
let currentReactingTo = null; // NEW: Separate variable for emoji picker

// Emoji picker configuration
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✨'];

/**
 * Initialize message interaction features
 */
function initMessageInteractions() {
    console.log('Initializing message interactions...');

    // Create and append emoji picker modal
    createEmojiPickerModal();

    // Create edit message modal
    createEditMessageModal();

    // Create reply indicator
    createReplyIndicator();

    console.log('Message interactions initialized');
}

/**
 * Create emoji picker modal
 */
function createEmojiPickerModal() {
    const modalHTML = `
        <div class="modal fade" id="emojiPickerModal" tabindex="-1">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">React with Emoji</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="emoji-grid" id="emoji-grid">
                            ${EMOJI_LIST.map(emoji => `
                                <button class="emoji-btn" onclick="selectEmoji('${emoji}')">${emoji}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Create edit message modal
 */
function createEditMessageModal() {
    const modalHTML = `
        <div class="modal fade" id="editMessageModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Message</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <textarea
                            class="form-control"
                            id="edit-message-textarea"
                            rows="3"
                            placeholder="Edit your message..."></textarea>
                        <div class="mt-2">
                            <small class="text-muted">Original message will be saved in edit history</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveEditedMessage()">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Create reply indicator
 */
function createReplyIndicator() {
    const indicatorHTML = `
        <div id="reply-indicator" class="reply-indicator d-none">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <small class="text-muted">Replying to</small>
                    <div><strong id="reply-to-username"></strong>: <span id="reply-to-content"></span></div>
                </div>
                <button type="button" class="btn-close btn-sm" onclick="cancelReply()"></button>
            </div>
        </div>
    `;

    // Insert before the message input
    const messageInput = document.querySelector('#message-input');
    if (messageInput && messageInput.parentElement) {
        messageInput.parentElement.insertAdjacentHTML('beforebegin', indicatorHTML);
    }
}

/**
 * Show emoji picker for a message
 */
function showEmojiPicker(messageId) {
    console.log('Opening emoji picker for message:', messageId);
    currentReactingTo = messageId;
    const modal = new bootstrap.Modal(document.getElementById('emojiPickerModal'));
    modal.show();
}

/**
 * Select and add emoji reaction
 */
function selectEmoji(emoji) {
    console.log('Emoji selected:', emoji, 'for message:', currentReactingTo);

    if (!currentReactingTo) {
        console.error('No message selected for reaction');
        return;
    }

    const messageId = currentReactingTo;
    currentReactingTo = null;

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('emojiPickerModal'));
    if (modal) modal.hide();

    // Send reaction to server
    addReaction(messageId, emoji);
}

/**
 * Add a reaction to a message
 */
async function addReaction(messageId, emoji) {
    try {
        const response = await fetch('/react', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_id: messageId,
                emoji: emoji,
                action: 'add'
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Reaction added successfully');
            // Force immediate UI update
            updateMessageReactionsInDOM(messageId);
        } else {
            console.error('Failed to add reaction:', data.message);
            alert('Failed to add reaction: ' + data.message);
        }
    } catch (error) {
        console.error('Error adding reaction:', error);
        alert('Error adding reaction. Please try again.');
    }
}

/**
 * Remove a reaction from a message
 */
async function removeReaction(messageId, emoji) {
    try {
        const response = await fetch('/react', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_id: messageId,
                emoji: emoji,
                action: 'remove'
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Reaction removed successfully');
            // Force immediate UI update
            updateMessageReactionsInDOM(messageId);
        } else {
            console.error('Failed to remove reaction:', data.message);
        }
    } catch (error) {
        console.error('Error removing reaction:', error);
    }
}

/**
 * Update message reactions in the DOM without re-rendering entire message
 */
async function updateMessageReactionsInDOM(messageId) {
    try {
        // Fetch latest messages (scoped to the active room) to get updated reactions
        const roomParam = new URLSearchParams(window.location.search).get('room');
        const messagesUrl = roomParam ? `/messages?room=${encodeURIComponent(roomParam)}` : '/messages';
        const response = await fetch(messagesUrl);
        const data = await response.json();

        if (data.success && data.messages) {
            // Find the message with this ID
            const message = data.messages.find(m => m.message_id === messageId);

            if (message) {
                // Use the global updateExistingMessage function if available (from app.js)
                const messageElement = $(`[data-message-id="${messageId}"]`);

                if (messageElement.length > 0 && typeof updateExistingMessage === 'function') {
                    // Use the centralized update function
                    updateExistingMessage(messageElement, message);
                } else {
                    // Fallback: manual update
                    const currentUsername = $('#status-username').text() || 'Unknown';
                    const domElement = document.querySelector(`[data-message-id="${messageId}"]`);

                    if (domElement) {
                        let reactionsContainer = domElement.querySelector('.message-reactions');

                        if (!reactionsContainer) {
                            const messageBubble = domElement.querySelector('.message-bubble');
                            if (messageBubble) {
                                reactionsContainer = document.createElement('div');
                                reactionsContainer.className = 'message-reactions mt-1';

                                const messageTime = domElement.querySelector('.message-time');
                                if (messageTime) {
                                    messageTime.parentNode.insertBefore(reactionsContainer, messageTime);
                                } else {
                                    messageBubble.appendChild(reactionsContainer);
                                }
                            }
                        }

                        if (reactionsContainer) {
                            const reactionsHTML = renderReactions(message.reactions || {}, messageId, currentUsername);

                            if (!reactionsHTML || reactionsHTML.trim() === '' || Object.keys(message.reactions || {}).length === 0) {
                                reactionsContainer.remove();
                            } else {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = reactionsHTML;
                                const innerContent = tempDiv.querySelector('.message-reactions');
                                if (innerContent) {
                                    reactionsContainer.innerHTML = innerContent.innerHTML;
                                }
                            }
                        }
                    }
                }

                console.log('Updated reactions for message:', messageId);
            }
        }
    } catch (error) {
        console.error('Error updating message reactions:', error);
    }
}

/**
 * Reply to a message (threading)
 */
function replyToMessage(messageId, username, content) {
    currentReplyTo = messageId;

    // Show reply indicator
    const indicator = document.getElementById('reply-indicator');
    const usernameEl = document.getElementById('reply-to-username');
    const contentEl = document.getElementById('reply-to-content');

    if (indicator && usernameEl && contentEl) {
        indicator.classList.remove('d-none');
        usernameEl.textContent = username;
        contentEl.textContent = content.length > 50 ? content.substring(0, 50) + '...' : content;

        // Focus on message input
        const messageInput = document.querySelector('#message-input');
        if (messageInput) messageInput.focus();
    }
}

/**
 * Cancel reply
 */
function cancelReply() {
    currentReplyTo = null;

    const indicator = document.getElementById('reply-indicator');
    if (indicator) {
        indicator.classList.add('d-none');
    }
}

/**
 * Get parent ID for threading
 */
function getReplyParentId() {
    return currentReplyTo;
}

/**
 * Edit a message
 */
function editMessage(messageId, currentContent) {
    currentEditingMessage = messageId;

    // Populate modal with current content
    const textarea = document.getElementById('edit-message-textarea');
    if (textarea) {
        textarea.value = currentContent;
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editMessageModal'));
    modal.show();
}

/**
 * Save edited message
 */
async function saveEditedMessage() {
    if (!currentEditingMessage) return;

    const textarea = document.getElementById('edit-message-textarea');
    const newContent = textarea ? textarea.value.trim() : '';

    if (!newContent) {
        alert('Message cannot be empty');
        return;
    }

    try {
        const response = await fetch('/edit_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_id: currentEditingMessage,
                new_content: newContent
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Message edited successfully');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editMessageModal'));
            if (modal) modal.hide();

            currentEditingMessage = null;
        } else {
            alert('Failed to edit message: ' + data.message);
        }
    } catch (error) {
        console.error('Error editing message:', error);
        alert('Error editing message');
    }
}

/**
 * Delete a message
 */
async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }

    try {
        const response = await fetch('/delete_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message_id: messageId
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Message deleted successfully');
        } else {
            alert('Failed to delete message: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
    }
}

/**
 * Show edit history for a message
 */
function showEditHistory(editHistory) {
    if (!editHistory || editHistory.length === 0) {
        alert('No edit history available');
        return;
    }

    let historyHTML = '<div class="edit-history"><h6>Edit History</h6>';

    editHistory.forEach((edit, index) => {
        const editDate = new Date(edit.edited_at).toLocaleString();
        historyHTML += `
            <div class="edit-entry mb-2">
                <small class="text-muted">Version ${index + 1} (${editDate})</small>
                <div>${edit.content}</div>
            </div>
        `;
    });

    historyHTML += '</div>';

    // Show in a modal or alert
    const modalHTML = `
        <div class="modal fade" id="editHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit History</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${historyHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('editHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('editHistoryModal'));
    modal.show();
}

/**
 * Render reactions for a message
 */
function renderReactions(reactions, messageId, currentUsername) {
    if (!reactions || Object.keys(reactions).length === 0) {
        return '';
    }

    let reactionsHTML = '<div class="message-reactions mt-1">';

    for (const [emoji, users] of Object.entries(reactions)) {
        const count = users.length;
        const hasReacted = users.includes(currentUsername);
        const userList = users.join(', ');

        reactionsHTML += `
            <span class="reaction-badge ${hasReacted ? 'reacted' : ''}"
                  title="${userList}"
                  onclick="${hasReacted ? `removeReaction('${messageId}', '${emoji}')` : `addReaction('${messageId}', '${emoji}')`}">
                ${emoji} ${count}
            </span>
        `;
    }

    reactionsHTML += '</div>';

    return reactionsHTML;
}

/**
 * Render message actions (reply, edit, delete, react)
 */
function renderMessageActions(message, currentUsername) {
    const isOwnMessage = message.sender === currentUsername;
    const messageId = message.message_id || '';
    const username = message.sender || '';

    // Escape a value for safe use inside an HTML attribute (avoids the old
    // inline-onclick string-interpolation bugs that broke on quotes/newlines).
    const attr = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Just a chevron trigger (appears on bubble hover). The menu itself is a single
    // page-level element positioned BELOW the message (see the context-menu logic).
    return `<button class="msg-menu-trigger js-menu"
        data-id="${attr(messageId)}" data-user="${attr(username)}"
        data-own="${isOwnMessage ? 1 : 0}" data-deleted="${message.deleted ? 1 : 0}"
        data-edited="${(message.edited && message.edit_history && message.edit_history.length) ? 1 : 0}"
        data-history="${attr(JSON.stringify(message.edit_history || []))}"
        title="More" aria-label="Message actions"><i class="bi bi-chevron-down"></i></button>`;
}

// ---- Page-level message context menu (opens BELOW the message, scroll-into-view) ----
function ensureMsgCtx() {
    let m = document.getElementById('msg-ctx');
    if (!m) { m = document.createElement('div'); m.id = 'msg-ctx'; m.hidden = true; document.body.appendChild(m); }
    return m;
}
function closeMsgCtx() { const m = document.getElementById('msg-ctx'); if (m) m.hidden = true; }

$(document).on('click', '.js-menu', function (e) {
    e.stopPropagation();
    const t = this, d = t.dataset;
    const $msg = $(t).closest('.message');
    const bubble = $msg.find('.message-bubble')[0] || t;
    const own = d.own === '1', deleted = d.deleted === '1', edited = d.edited === '1';
    let hist = []; try { hist = JSON.parse(d.history || '[]'); } catch (e2) {}
    window.__msgctx = { id: d.id, user: d.user, content: $msg.find('.message-content').first().text(), history: hist };

    let items = '';
    items += '<button class="ctx-mi ctx-react"><i class="bi bi-emoji-smile"></i> React</button>';
    items += '<button class="ctx-mi ctx-info"><i class="bi bi-info-circle"></i> Encryption info</button>';
    if (!deleted) items += '<button class="ctx-mi ctx-reply"><i class="bi bi-reply"></i> Reply</button>';
    if (own && !deleted) {
        items += '<button class="ctx-mi ctx-edit"><i class="bi bi-pencil"></i> Edit</button>';
        items += '<button class="ctx-mi ctx-delete danger"><i class="bi bi-trash"></i> Delete</button>';
    }
    if (edited) items += '<button class="ctx-mi ctx-history"><i class="bi bi-clock-history"></i> Edit history</button>';

    const m = ensureMsgCtx();
    m.innerHTML = items;
    m.hidden = false;
    m.style.left = '-9999px'; m.style.top = '-9999px';   // measure off-screen first
    const mh = m.offsetHeight, mw = m.offsetWidth;

    const msgsEl = document.querySelector('.wa-messages');
    const margin = 16;
    let rect = bubble.getBoundingClientRect();
    // If the menu would fall below the viewport, scroll this message up so it fits beneath.
    const overflow = (rect.bottom + 6 + mh + margin) - window.innerHeight;
    if (overflow > 0 && msgsEl) { msgsEl.scrollTop += overflow; rect = bubble.getBoundingClientRect(); }

    let top = rect.bottom + 6;
    let left = own ? (rect.right - mw) : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - mh - 8));
    m.style.top = top + 'px';
    m.style.left = left + 'px';
    m.classList.remove('in'); void m.offsetWidth; m.classList.add('in');
});
$(document).on('click', '#msg-ctx', function (e) { e.stopPropagation(); });
$(document).on('click', function () { closeMsgCtx(); });
$(document).on('keydown', function (e) { if (e.key === 'Escape') closeMsgCtx(); });
window.addEventListener('scroll', closeMsgCtx, true);

function openMsgInfo(id) {
    const info = (window.MSG_INFO || {})[id];
    if (!info) return;
    const esc = (v) => $('<div>').text(v == null ? '' : v).html();
    const row = (label, val, mono) => `<div class="mi-row"><span class="mi-label">${label}</span><span class="mi-val ${mono ? 'mi-mono' : ''}">${esc(val)}</span></div>`;
    document.getElementById('msg-info-body').innerHTML =
        '<div class="mi-sec">Message</div>' +
        row('Room', info.room) + row('Direction', info.direction) + row('Time', info.time) +
        '<div class="mi-sec">Encryption</div>' +
        row('Key ID', info.key_id, true) + row('Nonce', info.nonce, true) +
        row('Size before', info.size_before + ' bytes') + row('Size after', info.size_after + ' bytes') +
        '<div class="mi-label" style="margin-top:8px">Ciphertext</div>' +
        '<div class="mi-bytes mi-mono">' + esc(info.full_hex || info.encrypted_hex) + '</div>' +
        '<div class="mi-sec">Protocol</div>' +
        row('Algorithm', info.algorithm) + row('Pattern', 'Noise XX') + row('Key exchange', 'X25519');
    new bootstrap.Modal(document.getElementById('msgInfoModal')).show();
}

// context-menu item actions (use the captured __msgctx; menu lives outside the message)
$(document).on('click', '.ctx-react', function () { closeMsgCtx(); showEmojiPicker(window.__msgctx.id); });
$(document).on('click', '.ctx-info', function () { closeMsgCtx(); openMsgInfo(window.__msgctx.id); });
$(document).on('click', '.ctx-reply', function () { closeMsgCtx(); replyToMessage(window.__msgctx.id, window.__msgctx.user, window.__msgctx.content); });
$(document).on('click', '.ctx-edit', function () { closeMsgCtx(); editMessage(window.__msgctx.id, window.__msgctx.content); });
$(document).on('click', '.ctx-delete', function () { closeMsgCtx(); deleteMessage(window.__msgctx.id); });
$(document).on('click', '.ctx-history', function () { closeMsgCtx(); showEditHistory(window.__msgctx.history || []); });

/**
 * Render parent message indicator for threaded replies
 */
function renderParentMessageIndicator(parentId, messages) {
    if (!parentId) return '';

    // Find parent message
    const parentMessage = messages.find(m => m.message_id === parentId);

    if (!parentMessage) return '';

    const parentContent = parentMessage.deleted ? '[Message deleted]' : parentMessage.content;
    const parentSender = parentMessage.sender || 'Unknown';

    return `
        <div class="parent-message-indicator">
            <i class="bi bi-reply"></i>
            <small><strong>${parentSender}:</strong> ${parentContent.length > 40 ? parentContent.substring(0, 40) + '...' : parentContent}</small>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initMessageInteractions();
});
