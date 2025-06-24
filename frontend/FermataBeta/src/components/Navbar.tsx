import logo from '../assets/FermataBetaIcon.png'

function Navbar() {
	return (
		<>
			<nav className='flex items-center fixed top-0 left-0 w-full h-16 px-6 py-4 justify-between shadow-xl'>
				<a href="#" className='flex items-center space-x-3 hover:opacity-80 transition-opacity'>
						<img src={logo} alt="logo" className='h-10 w-10' />
						<span className='text-2xl font-bold'>Fermata Beta</span>
				</a>
			</nav>
		</>
	)
}

export default Navbar