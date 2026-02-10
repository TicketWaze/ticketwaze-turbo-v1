"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Edit2, MoreCircle, Trash } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import UserInformation from "./UserInformationsDrawerContent";
import UserWaitlistInformation from "./UserWaitlistInformations";
import GetRoleName from "@/lib/GetRoleName";
import RemoveInvitationDialogContent from "./RemoveInvitationDialogContent";
import RemoveMember from "./RemoveMember";
import EditMemberDialogContent from "./EditMemberDialogContent";
import {
  OrganisationMember,
  User,
  WaitlistMember,
} from "@ticketwaze/typescript-config";

export default function MemberList({
  members,
  waitlistMembers,
  authorized,
}: {
  members: OrganisationMember[];
  waitlistMembers: WaitlistMember[];
  authorized: boolean;
}) {
  const t = useTranslations("Settings.team");
  const { data: session } = useSession();
  return (
    <main className="min-h-[70dvh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                "font-bold text-[1.1rem] w-92 pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] w-md pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.email")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] w-92 pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.role")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] w-92 pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] w-20 pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              <span className={"opacity-0"}>Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member, key: number) => (
            <TableRow key={key}>
              <TableCell
                className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
              >
                <Drawer direction={"right"}>
                  <DrawerTrigger>
                    <span className={"cursor-pointer flex items-center gap-4"}>
                      {member.firstName} {member.lastName}
                      {session?.user.userId === member.userId && (
                        <span
                          className={
                            "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-primary-500  px-2 rounded-[30px] bg-[#f5f5f5]"
                          }
                        >
                          {t("you")}
                        </span>
                      )}
                    </span>
                  </DrawerTrigger>
                  <UserInformation member={member} authorized={authorized} />
                </Drawer>
              </TableCell>
              <TableCell
                className={
                  "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                }
              >
                <Drawer direction={"right"}>
                  <DrawerTrigger>
                    <span className={"cursor-pointer"}>{member.email}</span>
                  </DrawerTrigger>
                  <UserInformation member={member} authorized={authorized} />
                </Drawer>
              </TableCell>
              <TableCell
                className={
                  "text-[1.5rem]  font-medium leading-8 text-neutral-900"
                }
              >
                {member.role}
              </TableCell>
              <TableCell className={"hidden lg:table-cell"}>
                <span
                  className={
                    "py-[.3rem] text-[1.1rem]  font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                  }
                >
                  Active
                </span>
              </TableCell>
              {session?.user.userId !== member.userId && (
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  {authorized && (
                    <Popover>
                      <PopoverTrigger>
                        <div
                          className={
                            "w-8 h-8 cursor-pointer flex items-center justify-center rounded-full bg-neutral-100"
                          }
                        >
                          <MoreCircle
                            size="10"
                            color="#737C8A"
                            variant="Bulk"
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className={
                          "w-[23.6rem] p-0 m-0 bg-none right-8 shadow-none border-none mx-4"
                        }
                      >
                        <div
                          className={
                            "bg-neutral-100 p-4 rounded-3xl shadow-xl flex flex-col gap-4"
                          }
                        >
                          <span
                            className={
                              "font-medium py-2 border-b-[.1rem] border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
                            }
                          >
                            {t("more")}
                          </span>
                          <ul className={"flex flex-col gap-4"}>
                            <li>
                              <Dialog>
                                <DialogTrigger
                                  className={`font-normal group text-[1.4rem] py-4 leading-8 text-primary-500 flex items-center justify-between gap-4 w-full cursor-pointer  border-b-[.1rem] border-neutral-200`}
                                >
                                  <span className={""}>{t("edit")}</span>
                                  <Edit2
                                    size="20"
                                    variant="Bulk"
                                    color={"#E45B00"}
                                  />
                                </DialogTrigger>
                                <EditMemberDialogContent
                                  userId={member.userId}
                                  defaultRole={member.role}
                                  user={session?.user as User}
                                />
                              </Dialog>
                            </li>
                            <li>
                              <Dialog>
                                <DialogTrigger className={"w-full flex-1"}>
                                  <span
                                    className={`font-normal w-full cursor-pointer group text-[1.4rem] py-4 leading-8 text-failure flex items-center justify-between gap-4`}
                                  >
                                    <span className={""}>{t("remove")}</span>
                                    <Trash
                                      size="20"
                                      variant="Bulk"
                                      color={"#DE0028"}
                                    />
                                  </span>
                                </DialogTrigger>
                                <DialogContent className={"w-xl lg:w-208 "}>
                                  <DialogHeader>
                                    <DialogTitle
                                      className={
                                        "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
                                      }
                                    >
                                      {t("remove")}
                                    </DialogTitle>
                                    <DialogDescription className={"sr-only"}>
                                      <span>Remove member</span>
                                    </DialogDescription>
                                  </DialogHeader>
                                  <RemoveMember email={member.email} />
                                </DialogContent>
                              </Dialog>
                            </li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}

          {/* Waitlist member */}
          {waitlistMembers.map((member, key: number) => (
            <TableRow key={key}>
              <TableCell
                className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
              >
                <Drawer direction={"right"}>
                  <DrawerTrigger>
                    <span className={"cursor-pointer flex items-center gap-4"}>
                      {member.fullName}
                    </span>
                  </DrawerTrigger>
                  <UserWaitlistInformation
                    member={member}
                    authorized={authorized}
                  />
                </Drawer>
              </TableCell>
              <TableCell
                className={
                  "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                }
              >
                <Drawer direction={"right"}>
                  <DrawerTrigger>
                    <span className={"cursor-pointer"}>{member.email}</span>
                  </DrawerTrigger>
                  <UserWaitlistInformation
                    member={member}
                    authorized={authorized}
                  />
                </Drawer>
              </TableCell>
              <TableCell
                className={
                  "text-[1.5rem]  font-medium leading-8 text-neutral-900"
                }
              >
                {GetRoleName(member.role)}
              </TableCell>
              <TableCell className={"hidden lg:table-cell"}>
                <span
                  className={
                    "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-2 rounded-[30px] bg-[#f5f5f5]"
                  }
                >
                  {t("invited")}
                </span>
              </TableCell>
              <TableCell
                className={
                  "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                }
              >
                {authorized && (
                  <Popover>
                    <PopoverTrigger>
                      <div
                        className={
                          "w-8 h-8 cursor-pointer flex items-center justify-center rounded-full bg-neutral-100"
                        }
                      >
                        <MoreCircle size="10" color="#737C8A" variant="Bulk" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className={
                        "w-[23.6rem] p-0 m-0 bg-none right-8 shadow-none border-none mx-4"
                      }
                    >
                      <div
                        className={
                          "bg-neutral-100 p-4 rounded-3xl shadow-xl flex flex-col gap-4"
                        }
                      >
                        <span
                          className={
                            "font-medium py-2 border-b-[.1rem] border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
                          }
                        >
                          {t("more")}
                        </span>
                        <ul className={"flex flex-col gap-4"}>
                          <li>
                            <Dialog>
                              <DialogTrigger className={"w-full flex-1"}>
                                <span
                                  className={`font-normal w-full cursor-pointer group text-[1.4rem] py-4 leading-8 text-failure flex items-center justify-between gap-4`}
                                >
                                  <span className={""}>
                                    {t("remove_invitation")}
                                  </span>
                                  <Trash
                                    size="20"
                                    variant="Bulk"
                                    color={"#DE0028"}
                                  />
                                </span>
                              </DialogTrigger>
                              <DialogContent className={"w-xl lg:w-208 "}>
                                <DialogHeader>
                                  <DialogTitle
                                    className={
                                      "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
                                    }
                                  >
                                    {t("remove_invitation")}
                                  </DialogTitle>
                                  <DialogDescription className={"sr-only"}>
                                    <span>Remove member</span>
                                  </DialogDescription>
                                </DialogHeader>
                                <RemoveInvitationDialogContent
                                  email={member.email}
                                />
                              </DialogContent>
                            </Dialog>
                          </li>
                        </ul>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
