import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import api from "../api/axios";
import { setCredentials } from "../redux/slices/authSlice"; // ⬅️ Geüpdatet pad

export default function Register({ setWantLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: (newUser) =>
      api.post("/auth/register", newUser).then((res) => res.data),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success("Account succesvol aangemaakt!");
      navigate("/dashboard");
    },
    onError: (error) => {
      // Optioneel: als je onError niet globaal afhandelt in QueryClient
      toast.error(
        error.response?.data?.error || "Er ging iets mis bij het registreren.",
      );
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    registerMutation.mutate({ name, email, password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col border border-border p-6 rounded-2xl bg-card shadow-xs"
    >
      <div className="mb-4 flex flex-col">
        <label
          htmlFor="name"
          className="block text-xs font-medium text-fg-muted mb-1"
        >
          Naam:
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          required
        />
      </div>

      <div className="mb-4 flex flex-col">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-fg-muted mb-1"
        >
          Email:
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          required
        />
      </div>

      <div className="mb-4 flex flex-col">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-fg-muted mb-1"
        >
          Wachtwoord:
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm focus:outline-none focus:border-accent"
          required
          minLength={8}
        />
        <p className="text-xs text-fg-subtle mt-1">Minstens 8 karakters</p>
      </div>

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="bg-accent text-accent-fg hover:opacity-90 px-4 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer disabled:opacity-50"
      >
        {registerMutation.isPending ? "Bezig..." : "Registreren"}
      </button>

      <div className="mt-4 flex items-center justify-center text-sm">
        <span className="text-fg-muted">Al een account?</span>
        <button
          type="button"
          className="text-accent font-medium underline cursor-pointer ml-1"
          onClick={() =>
            setWantLogin ? setWantLogin(true) : navigate("/login")
          }
        >
          Log hier in
        </button>
      </div>
    </form>
  );
}
