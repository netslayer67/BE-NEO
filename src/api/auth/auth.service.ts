import { User } from '@/models/user.model';
import { generateToken } from '@/utils/jwt';
import { ApiError } from '@/errors/apiError';
import { ILoginInput, IRegisterInput } from './auth.validation';

export const registerUser = async (input: IRegisterInput) => {
  const userExists = await User.findOne({ email: input.email });
  if (userExists) {
    throw new ApiError(409, 'User with this email already exists.');
  }

  const user = await User.create(input);
  const token = generateToken({ id: user._id, role: user.role });

  // Hindari mengirim password kembali
  user.password = undefined;

  return { user, token };
};

export const loginUser = async (input: ILoginInput) => {
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = generateToken({ id: user._id, role: user.role });
  
  user.password = undefined;

  return { user, token };
};