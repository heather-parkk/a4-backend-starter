import { FormattableError } from "../framework/router";

/**
 * Corresponds to an action attempted by a user that contains bad values for parameters.
 * If this action was a HTTP request, status code for this error would be 400 Bad Request.
 */
export class BadValuesError extends FormattableError {
  public readonly HTTP_CODE = 400;
}

/**
 * Corresponds to an action attempted by a user that is not authenticated.
 * If this action was a HTTP request, status code for this error would be 401 Unauthorized.
 */
export class UnauthenticatedError extends FormattableError {
  public readonly HTTP_CODE = 401;
}

/**
 * Corresponds to a forbidden action attempted by a user.
 * If this action was a HTTP request, status code for this error would be 403 Forbidden.
 */
export class NotAllowedError extends FormattableError {
  public readonly HTTP_CODE = 403;
}

/**
 * Corresponds to an action that attempts to access a resource that doesn't exist.
 * If this action was a HTTP request, status code for this error would be 404 Not Found.
 */
export class NotFoundError extends FormattableError {
  public readonly HTTP_CODE = 404;
}

/**
 * Indicates a request conflict with the current state of the target resource
 * If this action was a HTTP request, status code for this error would be 405 Not Found.
 */
export class AlreadyRatedError extends FormattableError {
  public readonly HTTP_CODE = 409;
}

/**
 * Indicates a request conflict with the current state of the target resource
 * If this action was a HTTP request, status code for this error would be 409 Conflict error.
 */
export class AlreadyFriendsError extends FormattableError {
  public readonly HTTP_CODE = 409;
}

/**
 * Indicates a request conflict with the current state of the target resource
 * If this action was a HTTP request, status code for this error would be 409 Conflict error.
 */
export class FriendRequestNotFoundError extends FormattableError {
  public readonly HTTP_CODE = 409;
}
