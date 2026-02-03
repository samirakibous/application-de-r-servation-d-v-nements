import { Role } from '../../common/enums/role.enum';

export class User {
  id: number;
  username: string;
  password: string;
  role: Role;
}