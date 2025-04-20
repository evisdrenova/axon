import { Input } from "./ui/input";
import { FormEvent } from "react";

interface Props {
  error: string;
  username: string;
  setUsername: (val: string) => void;
  isLoading: boolean;
  handleLogin: (e: FormEvent<Element>) => Promise<void>;
}

export default function Login(props: Props) {
  const { error, setUsername, isLoading, username, handleLogin } = props;
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to Chat</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded font-medium text-white 
                  ${
                    isLoading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
