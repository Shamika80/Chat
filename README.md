# Real-time Chat Application with WebSockets

This is a real-time chat application built with Node.js, WebSockets, and Express.js. It allows users to join different chat rooms, send messages, edit messages, and delete messages, all in real-time.

## Features

*   Real-time communication using WebSockets.
*   Multiple chat rooms.
*   Message editing and deletion.
*   Basic input validation and sanitization.
*   Origin checking for security.
*   User-friendly interface with basic styling.

## Technologies Used

*   Node.js
*   WebSockets (`ws` library)
*   Express.js (for serving static files)
*   HTML
*   CSS
*   JavaScript

## Getting Started

1.  Clone the repository:
    ```bash
    git clone [https://github.com/your-username/realtime-chat-app.git](https://github.com/your-username/realtime-chat-app.git)
    ```

2.  Install dependencies:
    ```bash
    cd realtime-chat-app
    npm install ws express uuid
    ```

3.  Run the application:
    ```bash
    node server.js
    ```

4.  Open in your browser:
    Go to `http://localhost:3000/join_room.html` in your web browser.

## Usage

1.  Enter your name and a room name on the `join_room.html` page.
2.  Click "Join" to enter the chat room.
3.  Type your message in the input field and click "Send."
4.  You can edit or delete your own messages.

## File Structure
