import { useEffect, useState } from "react";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import TitleBar from "../../components/Titlebar/Titlebar";
import { Input } from "../../components/ui/input";
import Login from "../../components/Login";

export default function Home() {
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    console.log("logging user in");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("uysername", username);
      // Get token from your backend service
      const response = await window.electron.loginStart(username);
      console.log("Backend response:", response);

      const { user_id, client_config } = response;

      if (
        !client_config ||
        !client_config.user_token ||
        !client_config.api_key
      ) {
        throw new Error("Invalid response from server");
      }

      // Initialize chat client with API key
      const chatClient = StreamChat.getInstance(client_config.api_key);
      console.log("Chat client initialized");

      // Connect user with the token
      await chatClient.connectUser(
        {
          id: user_id,
          name: username,
        },
        client_config.user_token
      );
      console.log("User connected successfully");

      // Store the client in state
      setClient(chatClient);
      setIsLoggedIn(true);

      // Create or join a channel
      const channelId = `${username}-channel`;
      const newChannel = chatClient.channel("messaging", channelId, {
        name: `${username}'s Channel`,
        created_by_id: user_id,
        members: [user_id],
      });

      await newChannel.watch();
      setChannel(newChannel);

      setIsLoading(false);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
    }
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (client) {
        client
          .disconnectUser()
          .then(() => {
            console.log("User disconnected");
          })
          .catch((error) => {
            console.error("Error disconnecting user:", error);
          });
      }
    };
  }, [client]);

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col h-screen">
        <Login
          error={error}
          username={username}
          setUsername={setUsername}
          isLoading={isLoading}
          handleLogin={handleLogin}
        />
      </div>
    );
  }

  // Chat interface (shown after login)
  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      {client && channel ? (
        <Chat client={client}>
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p>Loading channel...</p>
        </div>
      )}
    </div>
  );
}
