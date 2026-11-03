"use client";

import { Fragment, useMemo, useState } from "react";
import { IoClose, IoTrash } from "react-icons/io5";
import { HiBell, HiBellSlash, HiPhoto, HiStar } from "react-icons/hi2";
import { Dialog, Transition } from "@headlessui/react";
import { Conversation, User } from "@prisma/client";
import { format } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";

import Avatar from "../../../components/Avatar";
import AvatarGroup from "../../../components/AvatarGroup";
import useActiveList from "../../../hooks/useActiveList";
import useOtherUser from "../../../hooks/useOtherUser";
import ImageModal from "./ImageModal";
import ConfirmModal from "./ConfirmModal";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: Conversation & {
    users: User[];
  };
  messages?: any[];
}

const ChatDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  data,
  messages = [],
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState((data as any).isMuted || false);

  const otherUser = useOtherUser(data);

  const joinedDate = useMemo(() => {
    return format(new Date(otherUser.createdAt), "PP");
  }, [otherUser.createdAt]);

  const title = useMemo(() => {
    return data.name || otherUser.name;
  }, [data.name, otherUser.name]);

  const { members } = useActiveList();
  const isActive = members.indexOf(otherUser?.email!) !== -1;
  const statusText = useMemo(() => {
    if (data.isGroup) {
      return `${data.users.length} members`;
    }

    return isActive ? "Active" : "Offline";
  }, [data.isGroup, data.users.length, isActive]);

  // Extract all shared images for Media Gallery
  const mediaList = useMemo(() => {
    return messages.filter((m) => m.image && !m.isDeleted).map((m) => m.image);
  }, [messages]);

  // Extract starred messages count
  const starredCount = useMemo(() => {
    return messages.filter((m) => m.starredByIds && m.starredByIds.length > 0).length;
  }, [messages]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    toast.success(next ? "Conversation muted" : "Notifications unmuted");
  };

  return (
    <>
      <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} />
      {selectedImage && (
        <ImageModal
          src={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl dark:bg-[#16171a] border-l border-slate-200 dark:border-slate-800">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-end">
                          <button
                            type="button"
                            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <IoClose size={22} />
                          </button>
                        </div>
                      </div>

                      <div className="relative mt-4 flex-1 px-4 sm:px-6">
                        <div className="flex flex-col items-center">
                          <div className="mb-3">
                            {data.isGroup ? (
                              <AvatarGroup users={data.users} />
                            ) : (
                              <Avatar user={otherUser} />
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {title}
                          </h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {statusText}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex gap-8 my-6">
                            {/* Mute Button */}
                            <div
                              onClick={toggleMute}
                              className="flex flex-col gap-1.5 items-center cursor-pointer group"
                            >
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-slate-700 transition">
                                {isMuted ? <HiBellSlash size={20} className="text-amber-500" /> : <HiBell size={20} />}
                              </div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                {isMuted ? "Unmute" : "Mute"}
                              </span>
                            </div>

                            {/* Delete Chat Button */}
                            <div
                              onClick={() => setConfirmOpen(true)}
                              className="flex flex-col gap-1.5 items-center cursor-pointer group"
                            >
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/50 transition">
                                <IoTrash size={20} />
                              </div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Delete
                              </span>
                            </div>
                          </div>

                          {/* Shared Media Gallery Section */}
                          <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <HiPhoto className="w-4 h-4 text-sky-500" />
                                Shared Media ({mediaList.length})
                              </span>
                            </div>

                            {mediaList.length === 0 ? (
                              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No photos shared yet
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {mediaList.map((imgUrl, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setSelectedImage(imgUrl)}
                                    className="relative h-20 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition border border-slate-200/50 dark:border-slate-700/50"
                                  >
                                    <Image
                                      src={imgUrl}
                                      alt="Shared media"
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Starred Messages Section */}
                          <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <HiStar className="w-4 h-4 text-amber-500 fill-current" />
                                Starred Messages
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {starredCount}
                              </span>
                            </div>
                          </div>

                          {/* Details Section */}
                          <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <dl className="space-y-4 text-xs">
                              {data.isGroup ? (
                                <div>
                                  <dt className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    Members ({data.users.length})
                                  </dt>
                                  <dd className="space-y-1.5">
                                    {data.users.map((user) => (
                                      <div key={user.id} className="flex items-center gap-2">
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                          <Image
                                            src={user.image || "/images/avatar-placeholder.png"}
                                            alt={user.name || "User"}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                          />
                                        </div>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                          {user.name}
                                        </span>
                                      </div>
                                    ))}
                                  </dd>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <dt className="font-semibold text-slate-500 dark:text-slate-400">
                                      Email
                                    </dt>
                                    <dd className="mt-0.5 text-slate-800 dark:text-slate-200 font-medium">
                                      {otherUser.email}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="font-semibold text-slate-500 dark:text-slate-400">
                                      Joined
                                    </dt>
                                    <dd className="mt-0.5 text-slate-800 dark:text-slate-200 font-medium">
                                      {joinedDate}
                                    </dd>
                                  </div>
                                </>
                              )}
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default ChatDrawer;
