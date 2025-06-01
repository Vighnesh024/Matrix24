import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 px-4">
      <motion.form
        onSubmit={handleSignup}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white bg-opacity-90 backdrop-blur-lg rounded-xl shadow-xl max-w-md w-full p-8"
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900">
          Create Account
        </h2>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center font-semibold"
          >
            {error}
          </motion.div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded bg-pink-600 text-white font-semibold text-lg shadow-lg hover:bg-pink-700 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="mt-6 text-center text-gray-700">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-pink-600 hover:text-pink-800 font-semibold transition"
          >
            Log in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
