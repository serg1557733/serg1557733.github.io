import { useState } from "react";
import { LoginPageProps } from "../types/types";
import { LoginData } from "../data/data";

const Login = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === LoginData.NAME && password === LoginData.PASSWORD) {
      localStorage.setItem("auth", LoginData.NAME);
      onLogin(LoginData.NAME);
    } else {
      alert("Неверные имя пользователя или пароль"); //test
    }
  };
  return (
    <div className="flex-col content-center justify-items-center w-[100vw] h-[100vh]">
      <div className="m-2 w-3/4">
        <h1 className="m-2">Login</h1>
        <h2>Введите свое имя и пароль</h2>
      </div>

      <div className="flex flex-col m-3 w-1/4">
        <input
          className="m-2"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="m-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="m-2 bg-blue-500" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
