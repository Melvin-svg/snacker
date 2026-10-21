"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const buttonVariants = {
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const Sort = ({ products = [], setProductList }) => {
  const [activeSort, setActiveSort] = useState("all");

  useEffect(() => {
    const list = Array.isArray(products) ? products : [];
    if (activeSort !== "all") {
      setProductList(
        list.filter((prod) => prod.category?.toLowerCase() === activeSort),
      );
    } else {
      setProductList(list);
    }
  }, [activeSort, products]);

  return (
    <motion.div 
      className="mt-4 flex gap-3 text-sm font-medium text-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.button
        onClick={() => setActiveSort("all")}
        className={`rounded-lg p-1 px-4 shadow ${activeSort === "all" ? "bg-primary font-bold text-dark-200" : "bg-dark-100 text-primary"}`}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h5>All List</h5>
      </motion.button>
      <motion.button
        onClick={() => setActiveSort("snacks")}
        className={`rounded-lg p-1 px-4 shadow ${activeSort === "snacks" ? "bg-primary font-bold text-dark-200" : "bg-dark-100 text-primary"}`}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h5>Snacks</h5>
      </motion.button>
      <motion.button
        onClick={() => setActiveSort("drinks")}
        className={`rounded-lg p-1 px-4 shadow ${activeSort === "drinks" ? "bg-primary font-bold text-dark-200" : "bg-dark-100 text-primary"}`}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <h5>Drinks</h5>
      </motion.button>
    </motion.div>
  );
};

export default Sort;
