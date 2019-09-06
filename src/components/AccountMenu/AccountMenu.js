import React, { Component } from 'react';

import { connect } from 'react-redux';
import * as actionTypes from '../../store/actions';

import AccountsService from '../../Services/AccountsService';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import PersonOutlineIcon from '@material-ui/icons/PersonOutlined';
import PersonIcon from '@material-ui/icons/Person';
import LinkIcon from '@material-ui/icons/Link';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Fade from '@material-ui/core/Fade';
import Zoom from '@material-ui/core/Zoom';

import { withStyles } from '@material-ui/core/styles';
import './AccountMenu.css';

const StyledTooltip = withStyles({ tooltip: { color: 'white', backgroundColor: 'black', fontSize: '12px' }, tooltipPlacementBottom: { marginTop: '5px' } })(Tooltip);

class AccountMenu extends Component {

    state = {
        accountMenuAnchorEl: null
    }

    handleUserSignIn = () => {
        AccountsService.SignIn()
            .then((result) => { // Successful sign-in.
                this.props.onSnackbarToggle(true, `Hi ${result.additionalUserInfo.profile.name}, you are now logged in.`, "information");
                this.handleCloseAccountMenu();
            })
            .catch((error) => { this.props.onSnackbarToggle(true, `Sign in error`, "error"); }); // Sign-in failed.
    }

    handleUserSignInAnonymously = () => {
        AccountsService.SignInAnonymously()
            .then((result) => { // Successful sign-in anonymously.
                this.props.onSnackbarToggle(true, `Hi, you are now logged in as a guest user.`, "information");
                this.handleCloseAccountMenu();
            })
            .catch((error) => { this.props.onSnackbarToggle(true, `Error! cannot sign in as a guest user.`, "error"); }); // Sign-in anonymously failed.
    }

    handleUserAccountLinking = () => {
        AccountsService.LinkAccount()
            .then((result) => { // Successful accounts linking.
                this.props.onSnackbarToggle(true, `You guest account was successfully linked with your Google account '${result.user.email}'.`, "information");
                this.handleCloseAccountMenu();
            })
            .catch((error) => { this.props.onSnackbarToggle(true, `Error! Cannot link with Google account '${error.email}' because you've probably used it before. Try to login with this account.`, "error"); }); // Accounts linking failed.
    }

    handleUserSignOut = () => {
        const loggedInUser = AccountsService.GetLoggedInUser();
        const relevantAccountMessage = loggedInUser.isAnonymous
            ? "guest account ?\nPlease pay attention that your list will be lost! You can link your Google account to save it."
            : `account '${loggedInUser.email}' ?`;
        if (window.confirm(`Are you sure you want to logout from your ${relevantAccountMessage} `)) {
            AccountsService.SignOut()
                .then((result) => { // Successful sign-out.
                    this.props.onSnackbarToggle(true, "You are now logged out", "information");
                    this.handleCloseAccountMenu();
                })
                .catch((error) => { this.props.onSnackbarToggle(true, `Sign out error`, "error"); }); // Sign-out failed.
        }
    }

    handleOpenAccountMenu = e => { this.setState({ accountMenuAnchorEl: e.currentTarget }); }

    handleCloseAccountMenu = e => { this.setState({ accountMenuAnchorEl: null }); }

    render() {
        const loggedInUser = AccountsService.GetLoggedInUser();
        const { accountMenuAnchorEl } = this.state;
        const isAccountMenuOpen = !!accountMenuAnchorEl;

        let signInOutButton = <MenuItem>
            <StyledTooltip title="Sign in with your Google account" TransitionComponent={Zoom}>
                <Button className="btnPadding" color="primary" variant="contained" onClick={this.handleUserSignIn}>
                    <PersonIcon />&nbsp;Sign in
                </Button>
            </StyledTooltip>
        </MenuItem>;

        let signInOutAnonymouslyButton = <MenuItem>
            <StyledTooltip title="Sign in anonymously" TransitionComponent={Zoom}>
                <Button className="btnPadding" color="default" variant="contained" onClick={this.handleUserSignInAnonymously}>
                    <PersonOutlineIcon />&nbsp;Login as a guest
                </Button>
            </StyledTooltip>
        </MenuItem>;

        if (loggedInUser) {
            signInOutButton = <MenuItem title="Logout" onClick={this.handleUserSignOut}>
                <Button id="loggedInBtn" className="btnPadding" color="primary" variant="contained">
                    {loggedInUser.isAnonymous
                        ? <><PersonOutlineIcon />&nbsp;Logout from Guest</>
                        : <><PersonIcon />&nbsp;Logout from {loggedInUser.displayName || loggedInUser.email}</>}
                </Button>
            </MenuItem>;

            signInOutAnonymouslyButton = loggedInUser.isAnonymous
                ? <MenuItem>
                    <StyledTooltip title="Link this guest account with your Google account to save your list" TransitionComponent={Zoom}>
                        <Button className="btnPadding" color="primary" variant="contained" onClick={this.handleUserAccountLinking}>
                            <LinkIcon />&nbsp;Link with Google
                        </Button>
                    </StyledTooltip>
                </MenuItem>
                : signInOutAnonymouslyButton = null;
        }

        return <>
            <IconButton id="accountMenu" color="primary" onClick={this.handleOpenAccountMenu}>
                <AccountCircle fontSize="large" />
            </IconButton>

            <Menu
                anchorEl={accountMenuAnchorEl}
                open={isAccountMenuOpen}
                onClose={this.handleCloseAccountMenu}
                TransitionComponent={Fade}
                keepMounted>
                {signInOutButton}
                {signInOutAnonymouslyButton}
            </Menu>
        </>;

    }

}

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
    onSnackbarToggle: (open, message, type) => dispatch({ type: actionTypes.TOGGLE_SNACKBAR, payload: { open, message, type } })
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountMenu);