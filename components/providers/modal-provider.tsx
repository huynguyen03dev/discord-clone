'use client'

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const CreateServerModal = dynamic(() => import("@/components/modals/create-server-modal").then(m => ({ default: m.CreateServerModal })));
const InviteModal = dynamic(() => import("@/components/modals/invite-modal").then(m => ({ default: m.InviteModal })));
const EditServerModal = dynamic(() => import("@/components/modals/edit-server-modal").then(m => ({ default: m.EditServerModal })));
const MembersModal = dynamic(() => import("@/components/modals/members-modal").then(m => ({ default: m.MembersModal })));
const CreateChannelModal = dynamic(() => import("@/components/modals/create-channel-modal").then(m => ({ default: m.CreateChannelModal })));
const EditChannelModal = dynamic(() => import("@/components/modals/edit-channel-modal").then(m => ({ default: m.EditChannelModal })));
const LeaveServerModal = dynamic(() => import("@/components/modals/leave-server-modal").then(m => ({ default: m.LeaveServerModal })));
const DeleteServerModal = dynamic(() => import("@/components/modals/delete-server-modal").then(m => ({ default: m.DeleteServerModal })));
const DeleteChannelModal = dynamic(() => import("@/components/modals/delete-channel-modal").then(m => ({ default: m.DeleteChannelModal })));
const MessageFileModal = dynamic(() => import("@/components/modals/message-file-modal").then(m => ({ default: m.MessageFileModal })));
const DeleteMessageModal = dynamic(() => import("@/components/modals/delete-message-modal").then(m => ({ default: m.DeleteMessageModal })));

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

  if (!isMounted) {
		return null;
	}

  return (
    <>
      <CreateServerModal />
      <InviteModal />
      <EditServerModal />
      <MembersModal />
      <CreateChannelModal />
      <EditChannelModal />
      <LeaveServerModal />
      <DeleteServerModal />
      <DeleteChannelModal />
      <MessageFileModal />
      <DeleteMessageModal />
    </>
  )
}