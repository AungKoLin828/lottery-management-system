import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className=" bg-white  rounded-xl  shadow  p-5 ">
      {title && <h3 className="font-semibold text-lg mb-3 ">{title}</h3>}
      {children}
    </div>
  );
}
