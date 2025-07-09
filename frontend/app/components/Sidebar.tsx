"use client";
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Upload,
  Terminal,
  BarChart3,
  FileText,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const Sidebar = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/upload", icon: Upload, label: "Upload" },
    { to: "/console", icon: Terminal, label: "Console" },
    { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { to: "/transactions", icon: FileText, label: "Transactions" },
  ];

  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">LAM Agent</h1>
            <p className="text-sm text-gray-500">Simulator</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex justify-between  bg-gray-50 rounded-lg p-3">
          <div className="">
            <p className="text-xs text-gray-600">System Status</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Online</span>
            </div>
          </div>
          <UserButton />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
