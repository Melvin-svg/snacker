"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import SearchBar from "./SearchBar";
import Sort from "./Sort";
import ProductList from "./ProductList";
import { BsEmojiFrownFill } from "react-icons/bs";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const ProductSection = ({ products = [] }) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const [productList, setProductList] = useState(safeProducts);
  return (
    <motion.div 
      className="mt-4 flex w-full flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <SearchBar products={safeProducts} setProductList={setProductList} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <Sort products={safeProducts} setProductList={setProductList} />
      </motion.div>
      <motion.p 
        className="mt-4 text-sm italic text-primary/50"
        variants={itemVariants}
      >
        It is recommended to place your order in front of the machine.
      </motion.p>
      {safeProducts.length > 0 ? (
          <ProductList products={productList} />
      ) : (
        <motion.div 
          className="flex w-full flex-col items-center pt-16 text-primary/50"
          variants={emptyStateVariants}
        >
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            <BsEmojiFrownFill size={80} />
          </motion.div>
          <motion.p 
            className="mt-2 text-center text-2xl font-extrabold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Oops! Shelf is Empty
          </motion.p>
          <motion.p 
            className="text-center leading-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            It seems there's nothing here at the moment. Check back later!
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductSection;
