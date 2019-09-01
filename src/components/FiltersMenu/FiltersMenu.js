import React, { Component } from 'react';

import { connect } from 'react-redux';
import * as actionTypes from '../../store/actions';

import AccountsService from '../../Services/AccountsService';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MovieFilterIcon from '@material-ui/icons/MovieFilter';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';

import { withStyles } from '@material-ui/core/styles';
import './FiltersMenu.css';

const StyledDialog = withStyles({ paper: { margin: '24px' } })(Dialog);
const StyledDialogTitle = withStyles({ root: { padding: '16px 24px 12px !important' } })(DialogTitle);
const StyledDialogContent = withStyles({ root: { padding: '0 14px !important' } })(DialogContent);
const StyledOutlinedInput = withStyles({ input: { padding: '18.5px 35px 18.5px 12px' }, notchedOutline: {} })(OutlinedInput);

class FiltersMenu extends Component {

    state = {
        isFiltersMenuOpen: false
    }

    componentDidMount() {
        this.setState({ currentFilters: this.props.filters });
        AccountsService.InitAccountService().onAuthStateChanged(user => {
            if (user) { // User is signed in.
                this.getMoviesToWatch();
                this.setDBListeners();
            }
        });
    }

    componentWillUnmount() { AccountsService.ClearListeners(["movies", "years", "counter"]); }

    setDBListeners = () => {
        AccountsService.GetDBRef("years").on('value',
            response => {
                const years = response.val() ? new Set([...response.val()]) : [];
                this.props.saveMoviesYears([...years].sort((a, b) => b - a));
            },
            error => { })

        AccountsService.GetDBRef("counter").on('value',
            response => { this.props.onMoviesCounterChange(response.val()); },
            error => { })
    }

    getMoviesToWatch = () => {
        this.props.toggleLoadingMovies(true);

        AccountsService.ClearListeners(["movies"]);

        const { filter, order, year, maxResults } = this.state.currentFilters; // state.currentFilters VS props.filters
        const filterToShow = filter === "releaseYear" ? "Year" : filter;
        let moviesDBRef = AccountsService.GetDBRef("movies");

        if (year === "All") {
            moviesDBRef = order === "descending"
                ? moviesDBRef.orderByChild(filterToShow).limitToLast(maxResults)
                : moviesDBRef.orderByChild(filterToShow).limitToFirst(maxResults);
        } else {
            moviesDBRef = moviesDBRef.orderByChild("Year").limitToFirst(maxResults).equalTo(year);
        }

        moviesDBRef.on('value',
            response => { this.handleFirebaseData(response, filterToShow, order, year); },
            error => {
                this.props.toggleLoadingMovies(false);
                this.props.onSnackbarToggle(true, `There was an error retrieving movies: ${error}`, "error");
            })
    }

    handleFirebaseData = (response, filter, order, year) => {
        let sortedMovies = [];

        if (year !== "All") {
            sortedMovies = this.sortMoviesOfTheSameYear(response.val(), filter, order);
        } else {
            order === "descending"
                ? response.forEach(elem => { sortedMovies.unshift({ key: elem.key, ...elem.val() }); })
                : response.forEach(elem => { sortedMovies.push({ key: elem.key, ...elem.val() }); });
        }
        this.props.saveMovies(sortedMovies);
    }

    sortMoviesOfTheSameYear = (movies, filter, order) => {
        let sortedMovies = [];

        for (const movieKey in movies) { sortedMovies.push({ key: movieKey, ...movies[movieKey] }); }

        sortedMovies = sortedMovies.sort((a, b) => { // filter(movie => !movie.Error).
            const movie1 = a[filter];
            const movie2 = b[filter];

            if (order === "descending") {
                return (movie2 > movie1
                    ? 1
                    : (movie2 === movie1 ? 0 : -1));
            } else {
                return (movie1 < movie2
                    ? -1
                    : (movie2 === movie1 ? 0 : 1));
            }
        });
        return sortedMovies;
    }

    handleChangeFilter = e => { this.setState(state => ({ filtersChanged: true, currentFilters: { ...state.currentFilters, [e.target.name]: e.target.value } })); }

    handleApplyFilters = () => {
        if (this.state.filtersChanged) {
            this.props.onFiltersChange(this.state.currentFilters);
            this.getMoviesToWatch(); // should setTimeout here if I want to use the updated filters
        }
        this.handleCloseFiltersMenu();
    }

    handleOpenFiltersMenu = () => { this.setState({ isFiltersMenuOpen: true, filtersChanged: false, currentFilters: this.props.filters }); }

    handleCloseFiltersMenu = () => { this.setState({ isFiltersMenuOpen: false }); };

    getOrderLabel = order => {
        switch (this.state.currentFilters.filter) {
            case "releaseYear": return order === "descending" ? "Newest first" : "Oldest first";
            case "NameEng": return order === "descending" ? "Z - A" : "A - Z";
            case "NameHeb": return order === "descending" ? "ת - א" : "א - ת";
            default: break;
        }
    }

    render() {
        const loggedInUser = AccountsService.GetLoggedInUser();
        const { isFiltersMenuOpen } = this.state;

        return (
            loggedInUser && !this.props.loadingMovies && <>
                <Button id="filtersMenuBtn" color="secondary" variant="contained" onClick={this.handleOpenFiltersMenu}>
                    <MovieFilterIcon />&nbsp;Filters
                </Button>

                <StyledDialog open={isFiltersMenuOpen} onClose={this.handleCloseFiltersMenu}>

                    <StyledDialogTitle>List filters
                        <IconButton className="modalCloseBtn" onClick={this.handleCloseFiltersMenu}>
                            <CloseIcon />
                        </IconButton>
                    </StyledDialogTitle>

                    <StyledDialogContent>
                        <form>
                            <div className="MenuFlex">
                                <FormControl id="sortByFilter" className="MenuElementMg" variant="outlined">
                                    <InputLabel htmlFor="sortFilter">Sort by</InputLabel>
                                    <Select
                                        value={this.state.currentFilters.filter}
                                        onChange={this.handleChangeFilter}
                                        input={<StyledOutlinedInput labelWidth={52} name="filter" id="sortFilter" />}
                                        autoWidth>
                                        <MenuItem value="releaseYear"><em>Year</em></MenuItem>
                                        <MenuItem value="NameEng">English Name</MenuItem>
                                        <MenuItem value="NameHeb">Hebrew Name</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl id="orderByFilter" className="MenuElementMg" variant="outlined">
                                    <InputLabel htmlFor="orderBy">Order</InputLabel>
                                    <Select
                                        value={this.state.currentFilters.order}
                                        onChange={this.handleChangeFilter}
                                        input={<StyledOutlinedInput labelWidth={41} name="order" id="orderBy" />}
                                        autoWidth>
                                        <MenuItem value="descending"><em>{this.getOrderLabel("descending")}</em></MenuItem>
                                        <MenuItem value="ascending">{this.getOrderLabel("ascending")}</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl id="menuYear" className="MenuElementMg" variant="outlined">
                                    <InputLabel htmlFor="showYear">Year</InputLabel>
                                    <Select
                                        value={this.state.currentFilters.year}
                                        onChange={this.handleChangeFilter}
                                        input={<StyledOutlinedInput labelWidth={33} name="year" id="showYear" />}
                                        autoWidth>
                                        <MenuItem value="All"><em>All</em></MenuItem>
                                        {this.props.moviesYears.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl id="menuMaxResults" className="MenuElementMg" variant="outlined">
                                    <InputLabel htmlFor="maxResults">Results</InputLabel>
                                    <Select
                                        value={this.state.currentFilters.maxResults}
                                        onChange={this.handleChangeFilter}
                                        input={<StyledOutlinedInput labelWidth={54} name="maxResults" id="maxResults" />}
                                        autoWidth>
                                        <MenuItem value={1000}>All</MenuItem>
                                        <MenuItem value={5}>5</MenuItem>
                                        <MenuItem value={10}><em>10</em></MenuItem>
                                        <MenuItem value={25}>25</MenuItem>
                                        <MenuItem value={50}>50</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </form>
                    </StyledDialogContent>

                    <DialogActions>
                        <Button id="applyFiltersBtn" color="primary" variant="contained" size="small" title="Apply filters" onClick={this.handleApplyFilters}>
                            <SaveIcon />&nbsp;Apply
                        </Button>
                    </DialogActions>

                </StyledDialog>
            </>
        );
    }
}

const mapStateToProps = state => state;

const mapDispatchToProps = dispatch => ({
    saveMovies: (movies) => dispatch({ type: actionTypes.SAVE_MOVIES, payload: movies }),
    saveMoviesYears: (moviesYears) => dispatch({ type: actionTypes.SAVE_MOVIES_YEARS, payload: moviesYears }),
    toggleLoadingMovies: (isLoading) => dispatch({ type: actionTypes.TOGGLE_LOADING_MOVIES, payload: isLoading }),
    onSnackbarToggle: (open, message, type) => dispatch({ type: actionTypes.TOGGLE_SNACKBAR, payload: { open, message, type } }),
    onMoviesCounterChange: (updatedCounter) => dispatch({ type: actionTypes.ON_MOVIES_COUNTER_CHANGE, payload: updatedCounter }),
    onFiltersChange: (filters) => dispatch({ type: actionTypes.ON_FILTERS_CHANGE, payload: filters })
});

export default connect(mapStateToProps, mapDispatchToProps)(FiltersMenu);