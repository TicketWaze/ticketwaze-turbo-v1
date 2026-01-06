"use client";

import { useEffect, useState } from "react";

const TableOfContents = () => {
  const [headings, setHeadings] = useState<Element[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const content = document.querySelector(".content") as Element;

    const headingElements = content.querySelectorAll("h2, h3");

    const headingArray = Array.from(headingElements);

    headingArray.forEach((heading) => {
      heading.setAttribute("data-id", heading.id);
    });

    setHeadings(headingArray);

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      let currentActive = null;
      headingArray.forEach((heading) => {
        const element = document.getElementById(heading.id) as HTMLElement;
        if (element?.offsetTop <= scrollPosition + 200) {
          currentActive = heading.id;
        }
      });
      setActive(currentActive);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id) as HTMLElement;
    element.scrollIntoView({ behavior: "smooth" });
    setActive(id);
  };

  const [expanded, setExpanded] = useState(false);
  const handleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <nav className={`${!headings.length && "hidden"} `}>
      <h3
        className="font-secondary uppercase cursor-pointer lg:cursor-auto select-none flex lg:block justify-between items-center"
        onClick={handleExpand}
      >
        {/* <span className="text-sm sm:text-base">Table of Contents</span> */}
        <span className="block lg:hidden">
          {/* prettier-ignore */}
          <svg className={expanded ? "rotate-45" : ""} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" height="1em"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" /></svg>
        </span>
      </h3>

      {/*{!headings.length && (*/}
      {/*  <div className="mt-6 flex flex-col gap-y-4">*/}
      {/*    <span className="h-4 w-[60%] block bg-dark/5 rounded"></span>*/}
      {/*    <span className="h-4 w-3/4 block bg-dark/5 rounded"></span>*/}
      {/*    <span className="h-4 w-[70%] block bg-dark/5 rounded"></span>*/}
      {/*    <span className="h-4 w-[65%] block bg-dark/5 rounded"></span>*/}
      {/*    <span className="h-4 w-[50%] block bg-dark/5 rounded"></span>*/}
      {/*  </div>*/}
      {/*)}*/}
      <ol className={`  ${expanded ? "block" : "hidden lg:block"}`}>
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={` mb-8 last:mb-0 text-[22px] group hover:text-black ${
              heading.id === active ? "text-black" : "text-neutral-500"
            }`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className="has-line-link has-line-link-secondary flex items-center gap-4"
            >
              <div
                className={`${heading.id === active ? "w-[75px]" : "w-[25px]"} rounded-[50px] h-[2.5px] ${heading.id === active ? "bg-black" : "bg-neutral-500"}`}
              ></div>
              <span
                className={`line-link-el group-hover:text-black transition-all ${
                  heading.id === active ? "text-black" : "text-neutral-500"
                }`}
                style={
                  heading.id === active
                    ? {
                        fontWeight: "bold",
                        backgroundSize: "100% 1px",
                      }
                    : undefined
                }
              >
                {heading.textContent}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default TableOfContents;
