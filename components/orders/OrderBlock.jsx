"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import ViewDetails from "./ViewDetails";
import { GoClockFill } from "react-icons/go";
import { FaCalendarAlt } from "react-icons/fa";
import { formatDateToYYYYMMDD, formatTimeTo12Hour } from "@/lib/utils";

const OrderBlock = ({ id, amount, timeStamp, status, products }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const qrRef = useRef(null);

  useEffect(() => {
    const formattedDate = formatDateToYYYYMMDD(timeStamp);
    const formattedTime = formatTimeTo12Hour(timeStamp);
    setDate(formattedDate);
    setTime(formattedTime);
  }, [timeStamp]);

  const handleDownloadQR = () => {
    if (qrRef.current === null) {
      return;
    }

    toPng(qrRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `qr-code-${id}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to download QR code image", err);
      });
  };

  return (
    <motion.div 
      className="flex max-w-full flex-col items-center rounded-lg bg-dark-100 p-4 text-neutral-50 shadow-lg"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -5,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        transition: { duration: 0.3 }
      }}
    >
      <div className="flex w-full items-center gap-4 md:justify-center">
        <motion.div 
          ref={qrRef} 
          className="rounded-md bg-white p-2"
          whileHover={{ 
            scale: 1.05,
            rotate: 2,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.95,
            transition: { duration: 0.1 }
          }}
        >
          <QRCode size={100} value={id} viewBox={`0 0 256 256`} />
        </motion.div>
        <motion.div 
          className="flex flex-col justify-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.p 
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <FaCalendarAlt size={18} /> {date}
          </motion.p>
          <motion.p 
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <GoClockFill size={18} /> {time}
          </motion.p>
          <motion.p 
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            Amount: ₹{amount}
          </motion.p>
          <motion.p
            className={`rounded-[0.5rem] border p-1 px-3 text-sm ${status === "completed" ? "border-green-500 text-green-500" : "border-yellow-500 text-yellow-500"}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            Order {status}
          </motion.p>
        </motion.div>
      </div>
      <motion.div 
        className="mt-4 flex w-full justify-center max-sm:justify-between sm:gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <ViewDetails
          id={id}
          amount={amount}
          timeStamp={timeStamp}
          status={status}
          products={products}
        />
        <motion.button
          className="rounded-lg bg-green-500 px-4 py-2 font-semibold text-neutral-50 hover:bg-green-400"
          onClick={handleDownloadQR}
          whileHover={{ 
            scale: 1.05,
            backgroundColor: "#4ade80",
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.95,
            transition: { duration: 0.1 }
          }}
        >
          Download QR
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default OrderBlock;
