import React , {useContext } from 'react';
import { RoomContext } from '../context/RoomContext';
//date picker
import DatePicker from 'react-datepicker';

// date picker css
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker.css'

//icons
import { BsCalendar} from 'react-icons/bs';

const CheckOut = () => {
  const { checkOutDate, setCheckOutDate } = useContext(RoomContext);
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
        selected={checkOutDate} 
        placeholderText='Check out'
        onChange={(date) => setCheckOutDate(date)} />
    </div>);
};

export default CheckOut;
