import React from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  layoutStyles,
  primaryButtonStyle,
  typographyStyles,
} from "../../utils/styles";

const UserHeader = ({ user }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Errore durante il logout");
    }
  };

  return (
    <div style={layoutStyles.flexBetween}>
      <h1 style={typographyStyles.h1}>Meal Planner</h1>
      <div style={layoutStyles.flex}>
        <span style={{ alignSelf: "center" }}>{user.email}</span>
        <button
          onClick={handleLogout}
          style={{ ...primaryButtonStyle, backgroundColor: "#757575" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserHeader;
