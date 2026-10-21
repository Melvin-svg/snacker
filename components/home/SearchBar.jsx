import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";

const SearchBar = ({ products = [], setProductList }) => {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const list = Array.isArray(products) ? products : [];
    const filtered = list.filter((prod) =>
      prod.name?.toLowerCase().includes(search),
    );
    setProductList(filtered);
  }, [search, products]);

  return (
    <motion.div 
      className="flex w-full gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div 
        className="flex w-full rounded-md bg-dark-100 p-3 text-primary shadow"
        whileHover={{ 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          transition: { duration: 0.2 }
        }}
        whileFocusWithin={{ 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <FiSearch size={23} />
        </motion.div>
        <motion.input
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
          type="text"
          placeholder="Search"
          className="w-full bg-transparent pl-2 placeholder:text-primary/50 focus:outline-none focus:ring-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        />
      </motion.div>
      <motion.button 
        className="rounded-md bg-dark-100 p-2 px-3 shadow"
        whileHover={{ 
          scale: 1.05,
          backgroundColor: "#2a2a2a",
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon icon-tabler icons-tabler-outline icon-tabler-adjustments-horizontal size-6 text-primary"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M4 6l8 0" />
          <path d="M16 6l4 0" />
          <path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M4 12l2 0" />
          <path d="M10 12l10 0" />
          <path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
          <path d="M4 18l11 0" />
          <path d="M19 18l1 0" />
        </motion.svg>
      </motion.button>
    </motion.div>
  );
};

export default SearchBar;
