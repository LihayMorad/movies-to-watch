import React, { Component } from 'react';
import axios from 'axios';

import { connect } from 'react-redux';
import * as actionTypes from '../../../store/actions';

import AnalyticsService from '../../../Services/AnalyticsService';

import MoviesResultsGrid from './MoviesResultsGrid/MoviesResultsGrid';
import MovieTrailerModal from '../MovieTrailerModal/MovieTrailerModal';
import SearchResultsSpinner from '../Spinners/SearchResultsSpinner';

import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Zoom,
} from '@material-ui/core';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    Whatshot as WhatshotIcon,
} from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const StyledDialog = withStyles({ paper: { margin: '24px' } })(Dialog);
const StyledDialogContent = withStyles({ root: { padding: '0 24px 12px !important' } })(
    DialogContent
);

const currYear = new Date().getFullYear();
const initialState = {
    NameHeb: '',
    NameEng: '',
    Year: currYear,
    Comments: '',
    movieSearchResults: [],
    imdbID: '',
    tmdbID: '',
    imdbRating: '',
    resultsType: '',
    loading: false,
    watchingTrailer: false,
    searchTrailerParams: '',
    searchID: '',
};

class movieAddModal extends Component {
    constructor(props) {
        super(props);

        this.personalNote = React.createRef();
        this.state = { ...initialState };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.isOpen !== this.props.isOpen) this.setState({ ...initialState });
    }

    handleChange = ({ target: { name, value } }) => {
        this.setState({ [name]: value.trim() });
    };

    handleAddMovie = () => {
        if (this.state.imdbID) {
            const { NameHeb, imdbID, tmdbID, Comments, selectedTitle, selectedYear } = this.state;
            const movieDetails = {
                NameHeb,
                NameEng: selectedTitle,
                imdbID,
                imdbRating: '',
                Comments,
                Year: parseInt(selectedYear),
                Watched: false,
                imdbRatingTimestamp: Date.now(),
            };
            if (this.state.tmdbID) {
                // save poster if we are adding movie from 'Popular Movies' search results
                const poster = this.state.movieSearchResults.find((movie) => movie.id === tmdbID)
                    .poster_path;
                if (poster) movieDetails.Poster = poster;
            }
            this.props.addMovie(movieDetails);
        } else {
            this.props.onSnackbarToggle(
                true,
                'Please search and choose a movie from the search results.',
                'information'
            );
        }
    };

    handleMovieSearch = () => {
        this.setState({ loading: true }, () => {
            let movieSearchResults = [];
            let resultsType = '';
            axios(
                `https://www.omdbapi.com/?s=${this.state.NameEng}&y=${this.state.Year}&type=movie&apikey=${process.env.REACT_APP_OMDB_API_KEY}`
            )
                .then((response) => {
                    if (response.status === 200 && response.data.Response === 'True') {
                        movieSearchResults = response.data.Search;
                        resultsType = 'search';
                    } else {
                        const message =
                            response.data.Error === 'Too many results.'
                                ? 'Too many results, please try to be more specific.'
                                : response.data.Error;
                        this.props.onSnackbarToggle(true, `Search error. ${message}`, 'warning');
                    }
                })
                .catch((error) => {
                    this.props.onSnackbarToggle(
                        true,
                        'Network error. Something went wrong!',
                        'error'
                    );
                })
                .finally(() => {
                    this.setState({
                        loading: false,
                        movieSearchResults,
                        imdbID: '',
                        tmdbID: '',
                        resultsType,
                    });
                });
        });
        AnalyticsService({
            category: 'Movie',
            action: 'Searching movies',
        });
    };

    handleTrendingMovieSearch = () => {
        this.setState({ loading: true }, () => {
            let movieSearchResults = [];
            let resultsType = '';
            axios(
                `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.REACT_APP_TMDB_API_KEY}`
            )
                .then((response) => {
                    if (response.status === 200) {
                        movieSearchResults = response.data.results;
                        resultsType = 'trending';
                    } else {
                        this.props.onSnackbarToggle(
                            true,
                            'Search error. Something went wrong!',
                            'warning'
                        );
                    }
                })
                .catch(() => {
                    this.props.onSnackbarToggle(
                        true,
                        'Network error. Something went wrong!',
                        'error'
                    );
                })
                .finally(() => {
                    this.setState({
                        loading: false,
                        movieSearchResults,
                        imdbID: '',
                        tmdbID: '',
                        resultsType,
                    });
                });
        });
        AnalyticsService({
            category: 'Movie',
            action: 'Searching trending movies',
        });
    };

    getIMDBID = (tmdbID, movieTitle, movieYear) => {
        axios(
            `https://api.themoviedb.org/3/movie/${tmdbID}/external_ids?api_key=${process.env.REACT_APP_TMDB_API_KEY}`
        )
            .then((response) => {
                if (response.status === 200) {
                    this.handleUpdateCurrentMovie(
                        response.data.imdb_id,
                        tmdbID,
                        movieTitle,
                        movieYear
                    );
                } else {
                    this.props.onSnackbarToggle(
                        true,
                        "Something went wrong! can't get movie data",
                        'warning'
                    );
                }
            })
            .catch(() => {
                this.props.onSnackbarToggle(true, 'Network error. Something went wrong!', 'error');
            });
    };

    handleUpdateCurrentMovie = (imdbID, tmdbID, title, year) => {
        this.setState({ imdbID, tmdbID, selectedTitle: title, selectedYear: year }, () => {
            this.personalNote.current.scrollIntoView({ behavior: 'smooth' });
        });
    };

    toggleWatchTrailer = (searchTrailerParams = '', searchID = '') => {
        this.setState((state) => ({
            searchTrailerParams,
            searchID,
            watchingTrailer: !state.watchingTrailer,
        }));
    };

    render() {
        const { imdbID, tmdbID, Year, movieSearchResults, loading } = this.state;

        return (
            <>
                <StyledDialog
                    open={this.props.isOpen}
                    onClose={this.props.toggle}
                    maxWidth="md"
                    fullWidth
                    TransitionComponent={Zoom}
                >
                    <DialogTitle id="movieAddModalTitle">
                        Add a movie to your watch list
                        <IconButton className="modalCloseBtn" onClick={this.props.toggle}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <form
                        id="movieAddModalForm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            this.handleMovieSearch();
                        }}
                    >
                        <StyledDialogContent>
                            <DialogContentText>
                                Search a movie or see popular movies now and then choose one from
                                the search results.
                                <br />
                                You may specify its hebrew name and your personal note below.
                                <br />
                                When you're done click 'Add'.
                            </DialogContentText>
                            <br />
                            <TextField
                                fullWidth
                                variant="outlined"
                                autoFocus
                                required
                                margin="dense"
                                id="movieNameEng"
                                name="NameEng"
                                label="Movie's English name"
                                inputProps={{ type: 'text', placeholder: 'Enter english name' }}
                                onChange={this.handleChange}
                            />
                            <TextField
                                fullWidth
                                variant="outlined"
                                margin="dense"
                                id="movieReleaseYear"
                                name="Year"
                                label="Movie's Release year"
                                defaultValue={Year}
                                inputProps={{
                                    type: 'number',
                                    placeholder: 'Enter release year',
                                    min: '1950',
                                    max: currYear + 2,
                                }}
                                onChange={this.handleChange}
                            />

                            <Button
                                type="submit"
                                color="primary"
                                variant="outlined"
                                className="movieAddModalBtn"
                            >
                                <SearchIcon />
                                Search
                            </Button>

                            <Button
                                type="button"
                                color="secondary"
                                variant="outlined"
                                className="movieAddModalBtn"
                                onClick={this.handleTrendingMovieSearch}
                            >
                                <WhatshotIcon />
                                &nbsp;Popular Movies
                            </Button>

                            {!loading ? (
                                this.state.resultsType && (
                                    <MoviesResultsGrid
                                        results={movieSearchResults}
                                        type={this.state.resultsType}
                                        imdbID={imdbID}
                                        tmdbID={tmdbID}
                                        updateCurrentMovie={this.handleUpdateCurrentMovie}
                                        toggleWatchTrailer={this.toggleWatchTrailer}
                                        getIMDBID={this.getIMDBID}
                                    />
                                )
                            ) : (
                                <SearchResultsSpinner />
                            )}

                            {imdbID && (
                                <>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        margin="dense"
                                        id="movieNameHeb"
                                        name="NameHeb"
                                        label="Movie's Hebrew name"
                                        placeholder="Enter hebrew name (optional)"
                                        inputProps={{ type: 'text' }}
                                        onChange={this.handleChange}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        multiline
                                        margin="normal"
                                        id="movieComments"
                                        name="Comments"
                                        label="Movie's Personal Note"
                                        placeholder="Enter Personal Note (optional)"
                                        onChange={this.handleChange}
                                        inputProps={{ type: 'text', ref: this.personalNote }}
                                    />
                                </>
                            )}
                        </StyledDialogContent>

                        {imdbID && (
                            <DialogActions>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    id="movieAddModalAddBtn"
                                    onClick={this.handleAddMovie}
                                >
                                    Add
                                </Button>
                            </DialogActions>
                        )}
                    </form>
                </StyledDialog>

                <MovieTrailerModal
                    isOpen={this.state.watchingTrailer}
                    toggle={this.toggleWatchTrailer}
                    searchParams={this.state.searchTrailerParams}
                    searchID={this.state.searchID}
                />
            </>
        );
    }
}

const mapStateToProps = (state) => state;

const mapDispatchToProps = (dispatch) => ({
    onSnackbarToggle: (open, message, type) =>
        dispatch({ type: actionTypes.TOGGLE_SNACKBAR, payload: { open, message, type } }),
});

export default connect(mapStateToProps, mapDispatchToProps)(movieAddModal);
