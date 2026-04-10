# murmur — Private Group Chat App

## Project Structure

```
chat-app/
├── backend/
│   ├── app.js              # Express server, passport strategies, login route
│   ├── schema.prisma       # Prisma schema (User, Chatroom, Message, FriendRequest)
│   ├── chatroomRoute.js    # Chatroom CRUD + add/remove user
│   ├── messagesRoute.js    # Message CRUD, includes sender info
│   ├── friendRoute.js      # Friend requests, search, auto-create DM chatroom
│   ├── userRoute.js        # User profile edit, password change, delete
│   └── signupRoute.js      # Registration
│
└── frontend/
    └── src/
        ├── main.jsx                          # Vite entry point
        ├── App.jsx                           # Router + route guards
        ├── AuthContext.jsx                   # Auth state (login/logout/updateUser)
        ├── api.js                            # All API calls in one place
        ├── styles/
        │   ├── global.css                    # CSS variables, reset, fonts
        │   ├── sidebar.css                   # Sidebar component styles
        │   ├── chat.css                      # ChatRoom, PeoplePage styles
        │   └── auth.css                      # Auth pages, modal, toast, buttons
        ├── components/
        │   ├── Sidebar.jsx                   # Left nav with rooms + user footer
        │   ├── Modal.jsx                     # Generic modal shell
        │   ├── Toast.jsx                     # Toast provider + useToast hook
        │   └── EditDisplayNameModal.jsx      # Edit profile modal
        └── pages/
            ├── HomePage.jsx                  # Landing page (unauthenticated)
            ├── LoginPage.jsx                 # Email + password login
            ├── SignupPage.jsx                # Registration form
            ├── NotPermittedPage.jsx          # 403 page
            ├── ChatLayout.jsx                # Shell: Sidebar + <Outlet>
            ├── ChatRoom.jsx                  # Messaging UI with 3s polling
            ├── PeoplePage.jsx                # Find friends, manage requests
            └── ChangePasswordPage.jsx        # Password change + logout
```

---

## Setup

### Backend

```bash
cd backend
npm install express passport passport-local passport-jwt jsonwebtoken \
            bcryptjs express-validator @prisma/client cors

# copy your existing userRoute.js and signupRoute.js into this folder

npx prisma migrate dev --name init
node app.js
```

Create a `.env` file:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/murmur"
JWT_SECRET="change-this-to-something-long-and-random"
CLIENT_ORIGIN="http://localhost:5173"
```

### Frontend

```bash
cd frontend
npm create vite@latest . -- --template react
# overwrite src/ with the files provided
npm install react-router-dom
npm run dev
```

Create a `.env` file:
```
VITE_API_URL=http://localhost:5000
```

---

## Key behaviours

| Feature | How it works |
|---|---|
| Auth | JWT in `localStorage`, sent as `Bearer` token on every request |
| Live chat | Client polls `GET /message/inchatroom/:id` every 3 seconds |
| DM rooms | Accepting a friend request auto-creates an `isDirect` chatroom |
| Sidebar names | DM rooms show the other user's `displayName` + `@identifier`; group rooms show `roomName` |
| Edit profile | Modal triggered from sidebar avatar; updates display name, identifier, email |
| Change password | Separate `/settings/password` page; logs user out after success |
| Remove user (chatroom) | Uses Prisma `disconnect` instead of re-fetching and filtering the whole user list |

---

## Notes

- The `removeuser` route now uses `prisma.chatroom.update({ data: { users: { disconnect: { id } } } })` — simpler and race-condition safe.
- `GET /chatroom/` returns rooms with `users` included so the sidebar can filter to rooms the current user belongs to client-side.
- `GET /message/inchatroom/:id` returns messages ordered by `createdAt asc` with `sender` included — no extra fetches needed in the chat room.
- Add `Link` to `/settings/password` wherever you want the password-change entry point (e.g. sidebar footer menu).
