import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const { t } = useTranslation();
  return (
    <nav
      className="card"
      style={{ display: "flex", alignItems: "center", gap: "2rem" }}
    >
      <Link to="/">{t("welcome")}</Link>
      <Link to="/games">{t("find_games")}</Link>
      <Link to="/venues">{t("venues")}</Link>
      <Link to="/admin">{t("admin")}</Link>
      <LanguageSwitcher />
    </nav>
  );
};

export default Navbar;
