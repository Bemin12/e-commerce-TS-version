import { Request, Response, NextFunction, ParamsDictionary } from 'express-serve-static-core';

type HandlerFn<P = ParamsDictionary> = (
  req: Request<P>,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export default <P = ParamsDictionary>(fn: HandlerFn<P>) =>
  (req: Request<P>, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
