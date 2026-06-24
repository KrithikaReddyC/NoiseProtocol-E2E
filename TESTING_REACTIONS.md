# Testing Message Reactions - Bug Fixes

## Bugs Fixed

1. ✅ **Reactions not appearing after selection** - Added `updateMessageReactionsInDOM()` function to immediately update UI
2. ✅ **Emoji picker variable conflict** - Created separate `currentReactingTo` variable
3. ✅ **Shared reaction objects** - Changed to deep copy in `forward_message_to_room()`
4. ✅ **Missing copy import** - Added `import copy` to app.py
5. ✅ **Better error handling** - Added console logging and user alerts

## How to Test

### Step 1: Start the Servers

**Terminal 1 - Start Noise Protocol Server:**
```bash
cd /Users/krith/Documents/Noise_Protocol_updated_Phase/noiseprotocol/Implementation
python3 noise_chat_server.py --host localhost --port 8000
```

**Terminal 2 - Start Web Application:**
```bash
cd /Users/krith/Documents/Noise_Protocol_updated_Phase/web_ui
python3 app.py
```

### Step 2: Open Browser Console

1. Open Chrome/Firefox/Safari
2. Go to `http://localhost:5001`
3. **Press F12** to open Developer Tools
4. Go to the **Console** tab (IMPORTANT - watch for errors/logs here)

### Step 3: Connect to Server

1. Enter username: `TestUser1`
2. Server: `localhost`
3. Port: `8000`
4. Click **Connect**
5. Wait for "Connected" status

### Step 4: Test Reactions

1. **Send a test message:**
   - Type: "Hello, this is a test message"
   - Press Enter/Send

2. **Check console logs:**
   - You should see message logs in the browser console

3. **Add a reaction:**
   - Hover over the message you just sent
   - You should see action buttons appear (😊, ↩️, ✏️, 🗑️)
   - Click the 😊 (smile) icon

4. **Watch console for logs:**
   ```
   Opening emoji picker for message: [uuid-here]
   ```

5. **Select an emoji** (e.g., 👍):
   - Click on the thumbs up

6. **Watch console for logs:**
   ```
   Emoji selected: 👍 for message: [uuid-here]
   Reaction added successfully
   Updated reactions for message: [uuid-here]
   ```

7. **Verify reaction appears:**
   - You should see a badge appear below the message: "👍 1"
   - Hover over it to see your username

### Step 5: Test Multi-User Reactions

1. **Open a second browser window** (or Incognito):
   - Go to `http://localhost:5001`
   - Connect as `TestUser2`

2. **Send messages from both users**

3. **User1 reacts to User2's message:**
   - User1: Hover and click 😊 on User2's message
   - Select ❤️
   - Watch console logs

4. **Check User2's window:**
   - Wait 2-3 seconds (for message polling)
   - The reaction should appear on User2's screen too
   - It should show "❤️ 1"

5. **User2 adds same reaction:**
   - User2: Click on the ❤️ badge
   - It should increase to "❤️ 2"

6. **Remove reaction:**
   - Click the badge again
   - It should decrease to "❤️ 1"

### Step 6: Test Other Features

#### Test Reply (Threading):
1. Hover over a message
2. Click ↩️ (reply icon)
3. Reply indicator should appear above message input
4. Type and send a reply
5. Reply should appear indented

#### Test Edit:
1. Hover over YOUR OWN message
2. Click ✏️ (edit icon)
3. Modal should open with current text
4. Edit the text
5. Click "Save Changes"
6. Message should update with "(edited)" badge

#### Test Delete:
1. Hover over YOUR OWN message
2. Click 🗑️ (delete icon)
3. Confirm deletion
4. Message should change to "[Message deleted]"

## Debugging Tips

### If reactions still don't appear:

1. **Check browser console** for errors:
   - Red error messages indicate JavaScript problems
   - Look for "TypeError" or "ReferenceError"

2. **Check Network tab:**
   - Click on Network tab in DevTools
   - Look for `/react` POST request
   - Click on it and check:
     - **Status:** Should be 200 OK
     - **Response:** Should show `{"success": true, ...}`

3. **Check message structure:**
   - In console, type: `$('.message').first().data('message-id')`
   - Should return a UUID, not undefined

4. **Force refresh messages:**
   - In console, type: `location.reload()`
   - Or just refresh the page (Ctrl+R / Cmd+R)

### Common Issues:

**Issue:** "Opening emoji picker for message: undefined"
- **Fix:** The message doesn't have a message_id
- **Solution:** Refresh the page and send a new message

**Issue:** Console shows "Failed to add reaction: Message not found"
- **Fix:** The message_id doesn't match any message in the server
- **Solution:** Send a new message and try again

**Issue:** Reaction appears briefly then disappears
- **Fix:** The updateMessageReactionsInDOM is removing it
- **Solution:** Check that the /messages endpoint returns reactions

**Issue:** Action buttons don't appear on hover
- **Fix:** CSS might not be loaded
- **Solution:** Check Network tab for `message_interactions.css` - should be 200 OK

## Expected Console Output (Success):

```
Initializing message interactions...
Message interactions initialized
Opening emoji picker for message: abc-123-def-456
Emoji selected: 👍 for message: abc-123-def-456
Reaction added successfully
Updated reactions for message: abc-123-def-456
```

## What to Look For:

✅ **Working correctly:**
- Emoji picker opens when clicking 😊
- Selecting emoji closes modal
- Reaction badge appears below message immediately
- Console shows "Reaction added successfully"
- Console shows "Updated reactions for message: [id]"
- Other users see the reaction (after a few seconds)

❌ **Not working:**
- Emoji picker doesn't open
- Selecting emoji does nothing
- Console shows errors in red
- Reaction doesn't appear
- "/react" request returns error (400/404/500)

## Next Steps After Testing:

If everything works:
- ✅ Reactions are complete!
- 🎉 Move on to next feature

If still not working:
- 📋 Share the console errors
- 📋 Share the Network tab /react response
- 📋 Share any error messages from the Flask server terminal

## Server-Side Debugging:

Check the Flask terminal for logs:
```
[2025-12-24 ...] INFO: Reaction added successfully
```

If you see errors in the Flask terminal, they will help debug the issue.

---

## Quick Test Commands (Browser Console):

```javascript
// Check if message_interactions.js is loaded
typeof showEmojiPicker

// Should output: "function"

// Check if a message has an ID
$('.message').first().data('message-id')

// Should output: "abc-123-..." (a UUID)

// Manually trigger emoji picker
showEmojiPicker('test-id')

// Should open the emoji picker modal

// Check current username
$('#status-username').text()

// Should output your username
```

