import {React,Fragment} from 'react';
import {Link} from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import "./Header.css";
import Logo from "../../../Images/logo.webp";


export default function Header(){

    return(
      <Fragment>
          <div className='navbar'>
          <div className='logo'>
            <img
            src={Logo}
            // src="https://i0.wp.com/therumzzline.com/wp-content/uploads/2021/03/Ecommerce-site-logo-Online-Shopping-N-Shop-Logo-copy.jpg?resize=1400%2C700&ssl=1"
            alt="Logo"
            />
          </div>
          <div className='links'>
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/contact">Contact</Link>
            {/* <Link to="/about">About</Link> */}
          </div>
          <div className='search'>
            <Link to="/search">Search</Link>
          </div>
          <div className='profile'>
            <Link to="/login">
              <AccountCircleIcon/>
            </Link>
          </div>
          </div>
      </Fragment>
    );
}
