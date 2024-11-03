// src/utils/styles.js

// Stili base per i bottoni
export const commonButtonStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "500",
  transition: "all 0.2s ease",
  fontSize: "14px",
  "&:hover": {
    opacity: 0.9,
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
};

// Varianti di bottoni
export const primaryButtonStyle = {
  ...commonButtonStyle,
  backgroundColor: "#4CAF50",
  color: "white",
};

export const secondaryButtonStyle = {
  ...commonButtonStyle,
  backgroundColor: "#f5f5f5",
  color: "#333",
  border: "1px solid #ddd",
};

export const dangerButtonStyle = {
  ...commonButtonStyle,
  backgroundColor: "#F44336",
  color: "white",
};

// Stili per gli input
export const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  width: "100%",
  transition: "border-color 0.2s ease",
  "&:focus": {
    outline: "none",
    borderColor: "#4CAF50",
    boxShadow: "0 0 0 2px rgba(76, 175, 80, 0.2)",
  },
};

// Stili per le card
export const cardStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  border: "1px solid #eee",
};

// Stili per i container
export const containerStyle = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "20px",
};

// Stili per la tipografia
export const typographyStyles = {
  h1: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "20px",
  },
  h2: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "16px",
  },
  h3: {
    fontSize: "20px",
    fontWeight: "500",
    color: "#444",
    marginBottom: "12px",
  },
  text: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.5",
  },
};

// Stili per le categorie dei pasti
export const getCategoryStyle = (category) => {
  const styles = {
    vegetariano: {
      backgroundColor: "#4CAF50",
      color: "white",
      boxShadow: "0 2px 4px rgba(76, 175, 80, 0.2)",
    },
    pesce: {
      backgroundColor: "#2196F3",
      color: "white",
      boxShadow: "0 2px 4px rgba(33, 150, 243, 0.2)",
    },
    carne: {
      backgroundColor: "#F44336",
      color: "white",
      boxShadow: "0 2px 4px rgba(244, 67, 54, 0.2)",
    },
    legumi: {
      backgroundColor: "#FF9800",
      color: "white",
      boxShadow: "0 2px 4px rgba(255, 152, 0, 0.2)",
    },
    zuppa: {
      backgroundColor: "#9C27B0",
      color: "white",
      boxShadow: "0 2px 4px rgba(156, 39, 176, 0.2)",
    },
    altro: {
      backgroundColor: "#757575",
      color: "white",
      boxShadow: "0 2px 4px rgba(117, 117, 117, 0.2)",
    },
  };
  return styles[category] || styles.altro;
};

// Stili per le form
export const formStyles = {
  group: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#555",
    fontSize: "14px",
    fontWeight: "500",
  },
  select: {
    ...inputStyle,
    backgroundColor: "white",
  },
  error: {
    color: "#F44336",
    fontSize: "12px",
    marginTop: "4px",
  },
};

// Stili per il layout
export const layoutStyles = {
  grid: {
    display: "grid",
    gap: "20px",
  },
  flex: {
    display: "flex",
    gap: "10px",
  },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flexCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

// Stili per badge e tag
export const badgeStyles = {
  default: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
  success: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    color: "#4CAF50",
  },
  warning: {
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    color: "#FF9800",
  },
  error: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    color: "#F44336",
  },
};

// Stili per le animazioni
export const animations = {
  fadeIn: {
    opacity: 0,
    animation: "fadeIn 0.3s ease forwards",
  },
  slideIn: {
    transform: "translateY(20px)",
    opacity: 0,
    animation: "slideIn 0.3s ease forwards",
  },
};

// Stili per responsive design
export const breakpoints = {
  mobile: "@media (max-width: 640px)",
  tablet: "@media (max-width: 768px)",
  desktop: "@media (max-width: 1024px)",
};
