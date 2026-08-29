/**
 * @param {Array<{type:string,speciality:string,location?:string,locations?:string[],price:number,availabilityRank:number}>} professionals
 * @param {{type?:string,speciality?:string,location?:string,maxPrice?:number|string,maxAvailabilityRank?:number|string}} filters
 */
export function filterProfessionals(professionals, filters = {}) {
  const type = String(filters.type || "").toLowerCase();
  const speciality = String(filters.speciality || "").trim().toLowerCase();
  const location = String(filters.location || "").toLowerCase();
  const maxPrice = filters.maxPrice === "" || filters.maxPrice == null ? Infinity : Number(filters.maxPrice);
  const maxAvailabilityRank = filters.maxAvailabilityRank === "" || filters.maxAvailabilityRank == null
    ? Infinity
    : Number(filters.maxAvailabilityRank);

  return professionals.filter((person) => {
    const places = [person.location, ...(person.locations || [])].filter(Boolean).map((place) => String(place).toLowerCase());
    return (!type || person.type.toLowerCase() === type)
      && (!speciality || person.speciality.toLowerCase().includes(speciality) || (person.specialities || []).some((item) => item.toLowerCase().includes(speciality)))
      && (!location || places.some((place) => place.includes(location)))
      && person.price <= maxPrice
      && person.availabilityRank <= maxAvailabilityRank;
  });
}

