function checkForbiddenRoles(forbiddenRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (user && user.role) {
      const hasForbiddenRole = forbiddenRoles.includes(user.role);

      if (!hasForbiddenRole) {
        next();
      } else {
        res
          .status(403)
          .json({
            message:
              "Unauthorized : You are not authorized to access this route",
          });
      }
    } else {
      res
        .status(403)
        .json({
          message: "Unauthorized : You are not authorized to access this route",
        });
    }
  };
}

module.exports = {
  checkForbiddenRoles,
};
