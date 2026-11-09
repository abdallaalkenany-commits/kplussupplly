"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MenuButton() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.getElementById("nav")?.classList.toggle("open", open);
  }, [open]);
  return (
    <button className="menu" aria-expanded={open} aria-controls="nav" aria-label="menu" onClick={() => setOpen(!open)}>☰</button>
  );
}
