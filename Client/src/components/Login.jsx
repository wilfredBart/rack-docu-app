import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { setCredentials } from "../redux/slices/authSlice";

function Login({ setWantLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials) =>
      axios.post("/auth/login", credentials).then((res) => res.data),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success("Ingelogd!");
      navigate("/");
    },
    onError: () => {},
  });

  function handleSubmit(e) {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col border border-gray-300 p-6 rounded-2xl bg-white shadow-xs"
    >
      <div className="mb-4 flex flex-col">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Email:
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div className="mb-4 flex flex-col">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Wachtwoord:
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer disabled:opacity-50"
      >
        {loginMutation.isPending ? "Inloggen..." : "Inloggen"}
      </button>

      <div className="mt-4 flex items-center justify-center text-sm">
        <span className="text-gray-600">Nog geen account?</span>
        <button
          type="button"
          className="text-blue-600 font-medium underline cursor-pointer ml-1"
          onClick={() => setWantLogin(false)}
        >
          Klik hier om te registreren
        </button>
      </div>
    </form>
  );
}

export default Login;
