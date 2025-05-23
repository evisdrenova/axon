"use client";
import { UpdateIcon } from "@radix-ui/react-icons";
import { cn } from "../../src/lib/utils";

import { ReactElement } from "react";

interface Props {
  className?: string;
}

export default function Spinner(props: Props): ReactElement {
  const { className } = props;
  return <UpdateIcon className={cn("animate-spin", className)} />;
}
