import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        background: "var(--dark-gray)",
        color: "white",
        padding: "2rem 1rem",
        marginTop: "auto", // Push footer to the bottom
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <Link to="/" style={{ color: "white", textDecoration: "none" }}>
            {t("home")}
          </Link>
          <Link to="/games" style={{ color: "white", textDecoration: "none" }}>
            {t("games")}
          </Link>
          {/* Add other relevant links */}
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--mid-gray)" }}>
          &copy; {new Date().getFullYear()} {t("app_name")}.{" "}
          {t("all_rights_reserved")}.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
