import { useState, useEffect, useContext } from "react";
import { database } from "../Firebase.js";
import { ref, onValue, push, set, update } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../App.js";
import { Modal, ButtonGroup, Button, CloseButton, Form } from "react-bootstrap";
import userAvatar from "../Icons/user-avatar-bear.png";

const POSTS_DATABASE_KEY = "posts";
const COMMENTS_DATABASE_KEY = "comments";

export default function Post(props) {
  const user = useContext(UserContext);
  const navigate = useNavigate();
  let location = useLocation();
  let postId = location.pathname.split("/").slice(-1);

  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [comment, setComment] = useState("");
  const [reactions, setReactions] = useState({});
  const [postComments, setPostComments] = useState({});
  const [editComment, setEditComment] = useState(false);
  const [editCommentKey, setEditCommentKey] = useState("");

  useEffect(() => {
    const postRef = ref(database, `${POSTS_DATABASE_KEY}/${postId}`);
    onValue(postRef, (snapshot) => {
      setUrl(snapshot.val().url);
      setContent(snapshot.val().content);
      setDate(snapshot.val().date);
      setAuthorEmail(snapshot.val().authorEmail);
      setReactions(snapshot.val().reactions);
      setPostComments(snapshot.val().comments);
    });
  }, []);

  const writeData = () => {
    const commentDate = new Date().toLocaleString();
    const postsCommentsRef = ref(
      database,
      `${POSTS_DATABASE_KEY}/${postId}/${COMMENTS_DATABASE_KEY}`
    );
    const newCommentRef = push(postsCommentsRef);
    set(newCommentRef, {
      userComment: comment,
      userCommentDate: commentDate,
      user: user.email,
    });
  };

  const handleReaction = (e) => {
    let emotion = e.target.name;
    const reactionsToUpdate = { ...reactions };
    const reactedUsers = reactionsToUpdate[emotion];
    if (!reactedUsers.includes(user.email)) {
      reactionsToUpdate[emotion] = [...reactedUsers, user.email];
    } else {
      reactionsToUpdate[emotion] = reactedUsers.filter(
        (userEmail) => userEmail !== user.email
      );
    }
    const postRef = ref(database, `${POSTS_DATABASE_KEY}/${postId}`);
    update(postRef, { reactions: reactionsToUpdate });
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    writeData();
    setComment("");
  };

  const handleEdit = (e) => {
    let commentKey = e.target.id;
    if (user.email === postComments[commentKey].user) {
      setComment(postComments[commentKey].userComment);
      setEditComment(true);
      setEditCommentKey(commentKey);
    }
  };

  const handleEditComment = (e) => {
    e.preventDefault();
    const editDate = new Date().toLocaleString();
    const edited = "edited";
    const postsCommentsRef = ref(
      database,
      `${POSTS_DATABASE_KEY}/${postId}/${COMMENTS_DATABASE_KEY}/${editCommentKey}`
    );
    update(postsCommentsRef, {
      status: edited,
      user: user.email,
      userComment: comment,
      userCommentDate: editDate,
    });
    setEditComment(false);
    setComment("");
    setEditCommentKey("");
  };

  const renderReactionButtons = () => {
    if (reactions.love && reactions.funny && reactions.shook && reactions.sad) {
      return (
        <ButtonGroup>
          <Button
            name="love"
            variant={reactions.love.includes(user.email) ? "dark" : "light"}
            onClick={handleReaction}
            disabled={!user.email}
          >
            😍 {reactions.love.length - 1}
          </Button>
          <Button
            name="funny"
            variant={reactions.funny.includes(user.email) ? "dark" : "light"}
            onClick={handleReaction}
            disabled={!user.email}
          >
            🤣 {reactions.funny.length - 1}
          </Button>
          <Button
            name="shook"
            variant={reactions.shook.includes(user.email) ? "dark" : "light"}
            onClick={handleReaction}
            disabled={!user.email}
          >
            😱 {reactions.shook.length - 1}
          </Button>
          <Button
            name="sad"
            variant={reactions.sad.includes(user.email) ? "dark" : "light"}
            onClick={handleReaction}
            disabled={!user.email}
          >
            😢 {reactions.sad.length - 1}
          </Button>
        </ButtonGroup>
      );
    }
  };

  const renderComments = () => {
    let comments = [];
    for (const commentKey in postComments) {
      comments = [
        ...comments,
        <div className="post-comment" key={commentKey}>
          <div>
            <div className="side-by-side-edit">
              {postComments[commentKey].userComment} {""}
            </div>{" "}
            <div className="edit-btn">
              {user.email === postComments[commentKey].user ? (
                <Button id={commentKey} name="edit" onClick={handleEdit}>
                  Edit
                </Button>
              ) : null}
            </div>
          </div>
          <div className="comment-info">
            {postComments[commentKey].user} {""}{" "}
            {postComments[commentKey].userCommentDate}
            <div className="comment-status">
              {postComments[commentKey].status
                ? postComments[commentKey].status
                : null}
            </div>
          </div>
        </div>,
      ];
    }
    return comments;
  };

  return (
    <Modal centered show={true} backdrop="static">
      <Modal.Header>
        <div className="user-avatar">
          <img src={userAvatar} alt={authorEmail} />
        </div>
        <div className="post-info">
          <div className="author">{authorEmail}</div>
          <div className="timestamp">{date}</div>
        </div>
        <CloseButton
          onClick={() => {
            navigate("/");
          }}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="post-body">
          <div>{content}</div>
          <div className="post-image">
            <img src={url} alt={content} />
          </div>
          <div className="reaction-btns">{renderReactionButtons()}</div>
        </div>

        <div className="post-comments">{renderComments()}</div>
      </Modal.Body>
      <Modal.Footer>
        {user.email && (
          <Form
            id="comment-form"
            onSubmit={editComment ? handleEditComment : handleSendComment}
          >
            <Form.Control
              as="textarea"
              rows={2}
              value={comment}
              placeholder="Join the conversation"
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="side-by-side-btns">
              <Button type="submit" variant="primary">
                {editComment ? `Edit Comment` : `Send comment`}
              </Button>
              <Button
                type={null}
                variant="primary"
                onClick={() => {
                  navigate("/");
                }}
              >
                Back to feed
              </Button>
            </div>
          </Form>
        )}
      </Modal.Footer>
    </Modal>
  );
}
