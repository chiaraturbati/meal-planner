import React from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import {
  containerStyle,
  cardStyle,
  typographyStyles,
  layoutStyles,
  inputStyle,
  primaryButtonStyle,
} from "../../utils/styles";

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  handleSignUp,
}) => {
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Inserisci email e password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (error) {
      let errorMessage = "Errore di login";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Email non valida";
          break;
        case "auth/user-disabled":
          errorMessage = "Questo account è stato disabilitato";
          break;
        case "auth/user-not-found":
          errorMessage = "Utente non trovato";
          break;
        case "auth/wrong-password":
          errorMessage = "Password non corretta";
          break;
        case "auth/too-many-requests":
          errorMessage = "Troppi tentativi. Riprova più tardi";
          break;
        default:
          errorMessage = `Errore di login: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  return (
    <div style={{ ...containerStyle, maxWidth: "400px" }}>
      <div style={cardStyle}>
        <h1 style={typographyStyles.h1}>Meal Planner</h1>
        <form onSubmit={handleLogin} style={layoutStyles.grid}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={primaryButtonStyle}>
            Login
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            style={{ ...primaryButtonStyle, backgroundColor: "#2196F3" }}
          >
            Registrati
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
