"""REST API for posts."""
import flask
import insta485
from insta485.api.helpers import get_username

@insta485.app.route('/api/v1/posts/<int:postid_url_slug>/')
def rest_get_post(postid_url_slug):
  """Return post on postid. """
  logname = get_username()
  if not logname:
    flask.abort(403)

  connection = insta485.model.get_db()

  # Get post
  cur = connection.execute(
      "select p.postid, p.filename as imgUrl, p.owner, "
      "p.created, u.filename as ownerImgUrl "
      "from posts p join users u on p.owner = u.username "
      "where p.postid = ?; ",
      (postid_url_slug, )
  )
  post = cur.fetchall()

  if len(post) != 1:
      flask.abort(404)

  # Get comments of this post
  cur = connection.execute(
      "select owner, text, commentid "
      "from comments "
      "where postid = ? "
      "order by commentid asc;",
      (postid_url_slug,)
  )
  comments = cur.fetchall()

  for comment in comments:
    if comment["owner"] == logname:
      comment["lognameOwnsThis"] = True
    else:
      comment["lognameOwnsThis"] = False
    comment["ownerShowUrl"] = f"/users/{comment['owner']}/"
    comment["url"] = f"/api/v1/comments/{comment['commentid']}/"

  # Get likes of this post
  cur = connection.execute(
      "select postid, owner, likeid "
      "from likes "
      "where postid =? ",
      (postid_url_slug, )
  )
  likes = cur.fetchall()

  context_likes = {}
  context_likes["lognameLikesThis"] = False
  context_likes["numLikes"] = len(likes)
  context_likes["url"] = None
  
  for like in likes:
      if like["owner"] == logname:
          context_likes["lognameLikesThis"] = True
          context_likes["url"] = f"/api/v1/likes/{like['likeid']}/"

  context = {
      "comments": comments,
      "created": post[0]["created"],
      "imgUrl": post[0]["imgUrl"],
      "likes": context_likes,
      "owner": post[0]["owner"],
      "ownerImgUrl": post[0]["ownerImgUrl"],
      "ownerShowUrl": f"/users/{post[0]['owner']}/",
      "postShowUrl": f"/posts/{postid_url_slug}/",
      "postid": postid_url_slug,
      "url": f"/api/v1/posts/{postid_url_slug}/"
      }

  return flask.jsonify(**context)
