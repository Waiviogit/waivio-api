const {
    WobjController,
    UserController,
    PostController,
    ObjectTypeController,
    AppController
} = require( '../controllers' );
const { Router } = require( 'express' );

const apiRoutes = new Router();
const wobjRoutes = new Router();
const userRoutes = new Router();
const postRoutes = new Router();
const appRoutes = new Router();
const objectTypeRoutes = new Router();

apiRoutes.use( '/api', wobjRoutes );
apiRoutes.use( '/api', userRoutes );
apiRoutes.use( '/api', postRoutes );
apiRoutes.use( '/api', appRoutes );
apiRoutes.use( '/api', objectTypeRoutes );

wobjRoutes.route( '/wobject' )
    .post( WobjController.index );
wobjRoutes.route( '/wobject/:authorPermlink' )
    .get( WobjController.show );
wobjRoutes.route( '/wobject/:authorPermlink/posts' )
    .post( WobjController.posts );
wobjRoutes.route( '/wobject/:authorPermlink/followers' )
    .post( WobjController.followers );
wobjRoutes.route( '/wobject/:authorPermlink/fields' )
    .post( WobjController.fields );
wobjRoutes.route( '/wobject/:authorPermlink/gallery' )
    .get( WobjController.gallery );
wobjRoutes.route( '/wobject/:authorPermlink/list' )
    .get( WobjController.list );
wobjRoutes.route( '/wobject/:authorPermlink/object_expertise' )
    .post( WobjController.objectExpertise );
wobjRoutes.route( '/wobjectSearch' )
    .post( WobjController.search );
wobjRoutes.route( '/wobjectsFeed' )
    .post( WobjController.feed );

userRoutes.route( '/user' )
    .get( UserController.index );
userRoutes.route( '/user/:userName' )
    .get( UserController.show );
userRoutes.route( '/user/:userName/following_objects' )
    .post( UserController.objects_follow );
userRoutes.route( '/user/:userName/objects_feed' )
    .post( UserController.objects_feed );
userRoutes.route( '/user/:userName/feed' )
    .post( UserController.feed );
userRoutes.route( '/user/:userName/objects_shares' )
    .post( UserController.userObjectsShares );

postRoutes.route( '/post/:author/:permlink' )
    .get( PostController.show );
postRoutes.route( '/posts' )
    .post( PostController.getPostsByCategory );

appRoutes.route( '/app/:appName' )
    .get( AppController.show );
objectTypeRoutes.route( '/objectTypes' )
    .post( ObjectTypeController.index );
objectTypeRoutes.route( '/objectTypesSearch' )
    .post( ObjectTypeController.search );
objectTypeRoutes.route( '/objectType/:objectTypeName' )
    .post( ObjectTypeController.show );

userRoutes.route( '/generalSearch' )
    .post( UserController.generalSearch );

module.exports = apiRoutes;
