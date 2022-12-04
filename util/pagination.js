function getPaginationOffsetAndCurrPage(
  req,
  totalResults,
  resultsPerPage,
  res,
  url
) {
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  let currPage = 1;

  if (req.query.page) currPage = Number(req.query.page);

  if (currPage > totalPages) {
    res.redirect(`${url}page=${totalPages}`);
    return;
  }

  if (currPage < 1) {
    res.redirect(`${url}page=1`);
    return;
  }

  const offset = (currPage - 1) * resultsPerPage;

  return { offset, currPage, totalPages };
}

function getPaginationMetadata(currPage, totalPages) {
  const leftPage = currPage - 1;
  const rightPage = currPage + 1;

  const paginationMetaData = {
    totalPages,
    currPage,
    leftPage,
    rightPage,
  };

  return paginationMetaData;
}

module.exports = {
  getPaginationOffsetAndCurrPage,
  getPaginationMetadata,
};
