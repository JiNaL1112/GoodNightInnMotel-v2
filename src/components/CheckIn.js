import React , {useContext } from 'react';
import { RoomContext } from '../context/RoomContext';
//date picker
import DatePicker from 'react-datepicker';

// date picker css
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker.css'

//icons
import { BsCalendar} from 'react-icons/bs';

const CheckIn = () => {
  const { checkInDate, setCheckInDate } = useContext(RoomContext);

  return (
  <div className='relative flex items-center h-full justify-end'>
    {/*icons */}
    <div className='absolute z-10 pr-8'>
      <div>
        <BsCalendar className='text-accent text-base'/>
      </div>
    </div>
    <DatePicker 
      className='w-full h-full' 
      selected={checkInDate} 
      placeholderText='Check in'
      onChange={(date) => setCheckInDate(date)} />
  </div>);
};

export default CheckIn;
