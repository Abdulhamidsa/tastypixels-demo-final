import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  Text,
  Avatar,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  IconButton,
  Badge,
  useDisclosure,
  Collapse,
  Spinner,
  Skeleton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogHeader,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { FaUser, FaList, FaEdit, FaTrash, FaComment, FaFlag, FaArrowUp, FaArrowDown } from "react-icons/fa";
import CardSkeleton from "@/components/CardSkeleton";
import CommentsSection from "@/components/CommentsSection";
import Upload from "@/components/Upload";
import useComments from "@/hooks/useComments";
import { useFetch } from "@/hooks/useFetchUser";
import Image from "next/legacy/image";
import { fetchWithTokenRefresh } from "@/utils/auth";

export default function Dashboard() {
  const { user, loading, uploadList, updateUpload, deleteUpload } = useFetch();
  const { comments, loadingComments, deletingCommentId, fetchComments, handleAddComment, handleDeleteComment } = useComments();
  const toast = useToast();
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [showCommentSection, setShowCommentSection] = useState({});
  const [loadingCommentSection, setLoadingCommentSection] = useState({});
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userData, setUserData] = useState(null);
  const [loadingUserUpdate, setLoadingUserUpdate] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  const handleEditUpload = (upload) => {
    setSelectedUploadId(upload._id);
    onEditOpen();
  };

  useEffect(() => {
    if (user) {
      setUserData(user);
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveEdit = async (editedUpload) => {
    try {
      await updateUpload(user._id, editedUpload);
      onEditClose();
      toast({
        title: "Upload updated.",
        description: "The upload has been successfully updated.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleRemoveUpload = async () => {
    try {
      await deleteUpload(selectedUploadId);
      onDeleteClose();
      toast({
        title: "Upload deleted.",
        description: "The upload has been successfully deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleComments = async (uploadId) => {
    setLoadingCommentSection((prev) => ({ ...prev, [uploadId]: true }));
    if (!showCommentSection[uploadId]) {
      await fetchComments(uploadId);
    }
    setLoadingCommentSection((prev) => ({ ...prev, [uploadId]: false }));
    setShowCommentSection((prev) => ({ ...prev, [uploadId]: !prev[uploadId] }));
  };
  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setLoadingUserUpdate(true);

    const updatedUser = {
      username,
      email,
      password,
    };

    try {
      const response = await fetchWithTokenRefresh("http://localhost:8000/api/edit-post", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      const data = await response.json();
      if (response.ok) {
        // Update the userData state immediately
        setUserData((prevUserData) => ({
          ...prevUserData,
          username: data.username,
          email: data.email,
        }));

        setPassword(""); // Clear the password field after update

        // Use a callback in the state update to ensure it happens before closing the modal
        setTimeout(() => {
          toast({
            title: "User updated.",
            description: "Your user information has been successfully updated.",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
          onClose(); // Close the modal
        }, 100);
      } else {
        console.error("Error updating user:", data.errors);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoadingUserUpdate(false);
    }
  };

  return (
    <Box width="100%" maxW="900px">
      <Heading as="h1" m={8} textAlign="center">
        User Dashboard
      </Heading>
      <Tabs variant="enclosed">
        <TabList mb={4}>
          <Tab>
            <FaUser />
            <Text ml={2}>User Info</Text>
          </Tab>
          <Tab>
            <FaList />
            <Text ml={2}>Posts</Text>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {loading ? (
              <Spinner />
            ) : (
              <Stack spacing={4}>
                <Box>
                  <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Edit User Info</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <Box as="form" onSubmit={handleUserUpdate}>
                          <FormControl id="username" mb={4}>
                            <FormLabel>Username</FormLabel>
                            <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                          </FormControl>
                          <FormControl id="email" mb={4}>
                            <FormLabel>Email</FormLabel>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                          </FormControl>
                          <FormControl id="password" mb={4}>
                            <FormLabel>Password</FormLabel>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                          </FormControl>
                          <Button type="submit" colorScheme="blue" isLoading={loadingUserUpdate}>
                            Save Changes
                          </Button>
                        </Box>
                      </ModalBody>
                    </ModalContent>
                  </Modal>
                </Box>

                {userData && (
                  <Flex align="center">
                    <Avatar size="xl" name={userData.username} src={userData.userAvatar} />
                    <Box ml={4}>
                      <Heading as="h2" size="lg">
                        {userData.username}
                      </Heading>
                      <Text>Email: {userData.email}</Text>
                      <Text>Username: {userData.username}</Text>
                    </Box>
                  </Flex>
                )}
                <Button onClick={onOpen} colorScheme="blue">
                  Edit User Info
                </Button>
              </Stack>
            )}
          </TabPanel>
          <TabPanel>
            {loading ? (
              <CardSkeleton />
            ) : uploadList && uploadList.length > 0 ? (
              uploadList.map((upload) => (
                <Box key={upload._id} position="relative" borderWidth="1px" borderRadius="lg" overflow="hidden" width="100%" maxW="400px" mx="auto" my="4" boxShadow="md" bg="gray.800">
                  <Box bg="white" p="4" display="flex" alignItems="center">
                    <Avatar w="45px" h="45px" name={upload.username} src={upload.userAvatar} mr="3" />
                    <Box color="black">
                      <Heading fontSize="xl" fontWeight="bold">
                        {upload.username}
                      </Heading>
                      <Text pt="1" fontSize="xs" color="gray.600">
                        Posted at: {new Date(upload.postedAt).toLocaleDateString()}
                      </Text>
                    </Box>
                    <Flex ml="auto" gap={2}>
                      <IconButton aria-label="Edit upload" icon={<FaEdit />} onClick={() => handleEditUpload(upload)} colorScheme="blue" bg="white" borderRadius="full" />
                      <IconButton
                        aria-label="Delete upload"
                        icon={<FaTrash />}
                        onClick={() => {
                          setSelectedUploadId(upload._id);
                          onDeleteOpen();
                        }}
                        colorScheme="red"
                        bg="white"
                        borderRadius="full"
                      />
                    </Flex>
                  </Box>
                  <Box p={3} bg="white" color="black">
                    <Heading fontSize="xl">{upload.title}</Heading>
                    <Text fontSize="md" mb={5}>
                      {upload.description}
                    </Text>
                    <Box display="flex" gap={1}>
                      {upload.tags.map((tag, index) => (
                        <Text fontSize="sm" color="gray.600" pb="2" key={`${tag}-${index}`}>
                          {tag}
                        </Text>
                      ))}
                    </Box>
                  </Box>
                  <Upload isOpen={isEditOpen} onClose={onEditClose} editedUpload={uploadList.find((upload) => upload._id === selectedUploadId)} onSave={handleSaveEdit} onCancel={onEditClose} />
                  <Box position="relative" overflow="hidden" w="100%" objectFit="cover" height="auto">
                    <Image alt={upload.imageUrl} src={upload.imageUrl} sizes="80vw" width={100} height={100} objectFit="contain" style={{ width: "100%", height: "100%" }} />
                  </Box>
                  <Badge textAlign="center" p="3" colorScheme="orange">
                    {upload.category}
                  </Badge>
                  <Flex p={4} gap={3} align="center">
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Button colorScheme="gray" variant="outline" cursor="none" _hover="none" style={{ pointerEvents: "none" }} disabled>
                        <FaArrowUp />
                      </Button>
                      <Text mx={2}>{upload.likes}</Text>
                    </Box>

                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Button colorScheme="gray" variant="outline" cursor="auto" _hover="none" disabled style={{ pointerEvents: "none" }}>
                        <FaArrowDown />
                      </Button>
                      <Text mx={2}>{upload.dislikes}</Text>
                    </Box>

                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Button aria-label="Comments" onClick={() => toggleComments(upload._id)} colorScheme={showCommentSection[upload._id] ? "teal" : "gray"} variant="outline" isLoading={loadingCommentSection[upload._id]}>
                        <FaComment />
                      </Button>
                      <Text>{comments[upload._id]?.length ?? upload.comments.length}</Text>
                    </Box>
                    <Button ml="auto" aria-label="Report" colorScheme="yellow" variant="outline">
                      <FaFlag />
                    </Button>
                  </Flex>
                  <Collapse in={showCommentSection[upload._id]} animateOpacity>
                    {loadingComments[upload._id] ? (
                      <Box w="100%">
                        {[...Array(comments[upload._id]?.length || 3)].map((_, index) => (
                          <Box key={index} p={2} borderWidth="1px" w="100%">
                            <Flex alignItems="center" mb={1}>
                              <Skeleton height="30px" width="30px" borderRadius="50%" />
                              <Skeleton ml={2} height="15px" width="80px" />
                            </Flex>
                            <Skeleton height="30px" width="100%" />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <CommentsSection
                        uploadId={upload._id}
                        userId={user.id}
                        comments={comments[upload._id] || []}
                        fetchComments={fetchComments}
                        handleDeleteComment={handleDeleteComment}
                        handleAddComment={handleAddComment}
                        showComments={showCommentSection[upload._id]}
                        loadingComments={loadingComments[upload._id]}
                        deletingCommentId={deletingCommentId}
                      />
                    )}
                  </Collapse>
                  <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered>
                    <AlertDialogOverlay>
                      <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                          Delete Upload
                        </AlertDialogHeader>
                        <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>
                        <AlertDialogFooter>
                          <Button ref={cancelRef} onClick={onDeleteClose}>
                            Cancel
                          </Button>
                          <Button colorScheme="red" onClick={handleRemoveUpload} ml={3}>
                            Delete
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialogOverlay>
                  </AlertDialog>
                </Box>
              ))
            ) : (
              <Text>No uploads available</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}