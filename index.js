const io = require("socket.io")(8800, {
  cors: {
    origin: "http://127.0.0.1:5173",
  },
});

let activeUsers = [];
let loginUsers = [];
const addNewUser = (username, socketId) => {
  !loginUsers.some((user) => user.username === username) &&
    loginUsers.push({ username, socketId });
};
const removeUser = (socketId) => {
  loginUsers = loginUsers.filter((user) => user.socketId !== socketId);
};
const getUser = (username) => {
  return loginUsers.find((user) => user.username === username);
};
io.on("connection", (socket) => {
  console.log("hiii");
  // add new User
  socket.on("newUser", (username) => {
    addNewUser(username, socket.id);
    console.log("Login User Connectee", loginUsers);
  });
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    const logedUser = loginUsers.find((user) => user.username === receiverId);
    console.log("Sending from socket to :", receiverId);
    console.log("Data: ", data);
    if (user) {
      io.to(user.socketId).emit("recieve-message", data);
    }
    if (logedUser) {
      io.to(logedUser.socketId).emit("recieve-notification", data);
      console.log("Notification data:", data);
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });
});
