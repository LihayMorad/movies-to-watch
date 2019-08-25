import React, { PureComponent } from 'react';
import firebase, { database } from '../../config/firebase';

import { connect } from 'react-redux'
import * as actionTypes from '../../store/actions';

import Movie from '../Movie/Movie';
import MovieTrailerModal from '../UI Elements/MovieTrailerModal/MovieTrailerModal';
import MovieCommentsModal from '../UI Elements/MovieCommentsModal/MovieCommentsModal';
// import InformationDialog from './InformationDialog/InformationDialog';
import MoviesSpinner from '../UI Elements/Spinners/MoviesSpinner/MoviesSpinner';

import FormControl from '@material-ui/core/FormControl';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Checkbox from '@material-ui/core/Checkbox';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';
import RemoveRedEyeOutlined from '@material-ui/icons/RemoveRedEyeOutlined';
import Badge from '@material-ui/core/Badge';
import Zoom from '@material-ui/core/Zoom';

import { withStyles } from '@material-ui/core/styles';
import './MoviesContainer.css';

const StyledTooltip = withStyles({
    tooltip: { color: 'white', backgroundColor: 'black', fontSize: '12px' },
    tooltipPlacementBottom: { marginTop: '0px' }
})(Tooltip);
const StyledIconButton = withStyles({ root: { color: 'white' } })(IconButton);

class MoviesContainer extends PureComponent {

    state = {
        showInformationDialog: false, informationDialogTitle: "",
        watchingTrailer: false, searchTrailerParams: "", searchID: "",
        editingComments: false, comments: ""
    }

    toggleInformationDialog = () => {
        this.setState(state => ({ showInformationDialog: !state.showInformationDialog }),
            () => setTimeout(() => { this.setState({ showInformationDialog: false }) }, 3000));
    }

    handleInformationDialogTitle = title => { this.setState({ informationDialogTitle: title }, () => { this.toggleInformationDialog(); }); }

    handleMovieDelete = (movieID, movieYear) => {
        let movieName = "";
        let isMovieWatched;
        let shouldDeleteYear = true;

        this.props.movies.filter(movie => {
            if (movieID === movie.key) {
                movieName = movie.NameEng;
                isMovieWatched = movie.Watched;
                return false;
            } else { // there is another movie with the same year
                if (movieYear === movie.Year) { shouldDeleteYear = false; }
            }
            return true;
        });

        if (movieName) { // movie found in props movies list
            database.ref(`/mymovies/${firebase.auth().currentUser.uid}/movies/${movieID}`).remove()
                .then(() => {
                    if (shouldDeleteYear) { this.handleYearDelete(movieYear); }
                    const counterNames = ["total"];
                    if (!isMovieWatched) { counterNames.push("unwatched"); }
                    this.handleCounterChange(counterNames, "Delete Movie");
                    this.props.onSnackbarToggle(true, `The movie '${movieName} (${movieYear})' deleted successfully`, "success");
                })
                .catch(() => { this.props.onSnackbarToggle(true, `Error! There was a problem deleting the movie '${movieName} (${movieYear})'`, "error"); })
        } else { this.props.onSnackbarToggle(true, `Error! There was a problem deleting the movie '${movieName} (${movieYear})'`, "error"); }
    }

    handleYearDelete = yearToDelete => {
        const years = this.props.moviesYears.filter(year => year !== yearToDelete);
        database.ref(`/mymovies/${firebase.auth().currentUser.uid}/years`).set([...years], (error) => {
            if (!error) { }
            else { console.log('error: ', error); }
        });
    }

    handleCounterChange = (names, type) => {
        const updatedCounter = { ...this.props.moviesCounter };
        switch (type) {
            case "Add Movie":
                names.forEach(name => { updatedCounter[name]++; })
                database.ref(`/mymovies/${firebase.auth().currentUser.uid}/counter`).set(updatedCounter, (error) => {
                    if (!error) { }
                    else { console.log('error: ', error); }
                });
                break;
            case "Delete Movie":
                names.forEach(name => { updatedCounter[name]--; })
                database.ref(`/mymovies/${firebase.auth().currentUser.uid}/counter`).set(updatedCounter, (error) => {
                    if (!error) { }
                    else { console.log('error: ', error); }
                });
                break;
            default: break;
        }
    }

    toggleWatchTrailer = (searchTrailerParams = "", searchID = "") => { this.setState(state => ({ searchTrailerParams, searchID, watchingTrailer: !state.watchingTrailer })); };

    toggleEditComments = (comments = "", userID = "", dbMovieID = "") => { this.setState(state => ({ comments, userID, dbMovieID, editingComments: !state.editingComments })) };

    handleEditComments = comments => {
        database.ref(`/mymovies/${this.state.userID}/movies/${this.state.dbMovieID}`).update({ Comments: comments }, (error) => {
            const message = !error
                ? "Personal note saved successfully"
                : "There was an error saving the note";
            this.setState({ comments: comments, editingComments: false },
                () => { this.props.onSnackbarToggle(true, message, !error ? "information" : "error"); });
        });
    }

    render() {
        // const { showInformationDialog, informationDialogTitle } = this.state;
        let moviesContainer = null;
        let loggedOutMessage = null;
        let counter = null;
        const firebaseUser = firebase.auth().currentUser;
        const isLoggedIn = !!firebaseUser;
        const dbMovies = this.props.movies || [];
        const { loadingMovies, moviesCounter } = this.props;

        if (isLoggedIn) {
            const movies = dbMovies
                .filter(movie => movie.NameEng.toLowerCase().includes(this.props.freeSearchFilter.toLowerCase())
                    && movie.Watched === this.props.showWatchedMovies)
                .map(movie => (
                    <Movie
                        key={movie['key']}
                        dbMovieID={movie['key']}
                        {...movie}
                        imdbID={movie['imdbID'] || null}
                        userID={firebase.auth().currentUser.uid}
                        userEmail={firebase.auth().currentUser.email}
                        delete={this.handleMovieDelete}
                        toggleWatchTrailer={this.toggleWatchTrailer}
                        toggleEditComments={this.toggleEditComments} />
                ));

            moviesContainer = !loadingMovies
                ? moviesContainer = dbMovies.length === 0
                    ? <>
                        <h3 className="noResultsH3">No results</h3>
                        <h4 className="noResultsH4">Add a movie or change list filters</h4>
                    </>
                    : <div className="MoviesContainer">{movies}</div>
                : <MoviesSpinner />;

            counter = <FormControl>
                <StyledTooltip disableFocusListener disableTouchListener title="Watched movies" TransitionComponent={Zoom}>
                    <Checkbox
                        checked={this.props.showWatchedMovies}
                        icon={<StyledIconButton >
                            <Badge badgeContent={moviesCounter.unwatched} color="secondary">
                                <RemoveRedEyeOutlined fontSize="large" />
                            </Badge>
                        </StyledIconButton>}
                        checkedIcon={<StyledIconButton >
                            <Badge badgeContent={moviesCounter.total - moviesCounter.unwatched} color="secondary">
                                <RemoveRedEye fontSize="large" />
                            </Badge>
                        </StyledIconButton>}
                        onChange={this.props.toggleWatchedMovies} />
                </StyledTooltip>
            </FormControl>

        } else {
            loggedOutMessage = <><br />
                <h3 className="noResultsH3">Please login to edit your list</h3>
                <h4 className="noResultsH4">(You can login as a guest)</h4>
            </>
        }

        return (
            <div>

                {loggedOutMessage}

                {counter}

                {moviesContainer}

                {/* <InformationDialog
                    isOpen={showInformationDialog}
                    toggle={this.toggleInformationDialog}
                    dialogTitle={informationDialogTitle} /> */}

                <MovieTrailerModal
                    isOpen={this.state.watchingTrailer}
                    toggle={this.toggleWatchTrailer}
                    searchParams={this.state.searchTrailerParams}
                    searchID={this.state.searchID} />

                <MovieCommentsModal
                    isOpen={this.state.editingComments}
                    toggle={this.toggleEditComments}
                    comments={this.state.comments}
                    handleEditComments={this.handleEditComments} />

            </div >
        );

    }

}

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
    onSnackbarToggle: (open, message, type) => dispatch({ type: actionTypes.TOGGLE_SNACKBAR, payload: { open, message, type } }),
    toggleWatchedMovies: () => dispatch({ type: actionTypes.TOGGLE_WATCHED_MOVIES })
});

export default connect(mapStateToProps, mapDispatchToProps)(MoviesContainer);