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
    <div className="min-h-screen flex items-center bg-brand-lightest">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-muted/30 w-full max-w-md ml-12">
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">
          Account aanmaken
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 border border-brand-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
            <p className="text-xs text-slate-400 mt-1">Minstens 8 karakters</p>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="cursor-pointer w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
          >
            {registerMutation.isPending ? "Bezig..." : "Registreren"}
          </button>
        </form>

        <p className="text-slate-500 text-sm mt-4 text-center">
          Al een account?{" "}
          <button
            type="button"
            onClick={() =>
              setWantLogin ? setWantLogin(true) : navigate("/login")
            }
            className="text-brand hover:underline cursor-pointer"
          >
            Log hier in
          </button>
        </p>
      </div>
    </div>
  );
}
